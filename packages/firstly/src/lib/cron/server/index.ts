import { CronJob } from 'cron'

import { repo } from 'remult'
import { Module } from 'remult/server'
import { green, magenta, red, yellow } from '@kitql/helpers'

import { log } from '..'
import { Cron } from '../Cron'

export const jobs: Record<
	string,
	{ job: CronJob<null, unknown> | null; concurrentInProgress: number }
> = {}

/**
 * Link to a nice Cheatsheet TODO
 */
export const cronTime = {
	/**
	 * Every morning is actually at 4 am and 7 minutes. (because I like this number!)
	 */
	every_morning: '0 7 4 * * *',

	/**
	 * Every second
	 */
	every_second: '* * * * * *',

	/**
	 * Every minute
	 */
	every_minute: '0 * * * * *',

	/**
	 * Every 10 minute
	 */
	every_10_minute: '*/10 * * * *',

	/**
	 * Every friday at 5:11 am
	 */
	every_friday_morning: '11 5 * * 5',
}

/**
 * Type for onTick function that must return a Record<string, any>
 */
export type CronOnTick = () => Record<string, any> | Promise<Record<string, any>>

/**
 * Type for cron job parameters with enforced onTick return type
 */
export type CronJobParams = {
	cronTime: string | Date
	onTick: CronOnTick
	topic: string
	concurrent?: number
	/**
	 * Defaults: one `done in Xms` line per tick + a `setup done` line at registration.
	 * `starting` & `result` are opt-in (full history incl. results is stored in `_ff_crons`).
	 * Failures and concurrency skips are always logged.
	 */
	logs?: { setup?: boolean; starting?: boolean; result?: boolean; ended?: boolean }
	start?: boolean
	runOnInit?: boolean
	timeZone?: string
	utcOffset?: string | number
	onComplete?: () => void
}

const duration = (startedAt: number) => {
	const ms = Date.now() - startedAt
	return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

/**
 * usage:
 *
 * ```ts
 * import { cron, cronTime } from 'firstly/cron'
 *
 * export const api = firstly({
 *   modules: [
 *     cron([{
 *       topic: 'first_cron',
 *       cronTime: cronTime.every_second,
 *       onTick: () => {
 *         console.log('hello')
 *         return { status: 'success' }
 *       },
 *       start: !dev, // Start in production
 *       // runOnInit: dev, // nice in dev environement
 *     }])
 *   ]
 * })
 * ```
 *
 * using [cron](https://www.npmjs.com/package/cron) library under the hood
 */
export const cron: (jobsInfos: CronJobParams[]) => Module<unknown> = (jobsInfos) => {
	const m = new Module({
		key: 'cron',

		entities: [Cron],
	})

	m.initApi = async () => {
		jobsInfos.forEach((infos) => {
			const { topic, runOnInit, logs, concurrent, onTick: originalOnTick, ...params } = infos

			const concurrentToUse = concurrent ?? 1
			const prefix = magenta(`[${topic}]`)

			// Create a wrapper that converts the return type to void for CronJob
			const wrappedOnTick = async (): Promise<void> => {
				if (jobs[topic].concurrentInProgress >= concurrentToUse) {
					await repo(Cron).insert({ topic, status: 'skipped' })
					log.info(
						`${prefix} skipped because of concurrent limit (${yellow(concurrentToUse.toString())})`,
					)
					return
				}

				jobs[topic].concurrentInProgress++
				const startedAt = Date.now()
				const rCron = await repo(Cron).insert({ topic })
				if (logs?.starting) {
					log.info(`${prefix} starting...`)
				}
				try {
					const res = await originalOnTick()
					rCron.result = res
					rCron.endedAt = new Date()
					rCron.status = 'ended'
					await repo(Cron).save(rCron)

					if (logs?.ended !== false) {
						const msg = `${prefix} done in ${duration(startedAt)}`
						if (logs?.result) {
							log.success(msg, res)
						} else {
							log.success(msg)
						}
					}
				} catch (error) {
					rCron.result = { error: error instanceof Error ? error.message : String(error) }
					rCron.endedAt = new Date()
					rCron.status = 'failed'
					await repo(Cron).save(rCron)
					log.error(`${prefix} failed after ${duration(startedAt)}`, error)
				} finally {
					jobs[topic].concurrentInProgress--
				}
			}

			// Use type assertion to bypass complex generic type issues
			const job = CronJob.from({
				...params,
				onTick: wrappedOnTick,
			} as any) as CronJob<null, unknown>

			jobs[topic] = { job, concurrentInProgress: 0 }

			if (logs?.setup !== false) {
				// A stopped job still reports a next date, it just won't fire it.
				log.success(
					`${prefix} setup done (${job.isActive ? green('running') : red('stopped')}, next at ${yellow(job.nextDate().toISO()!)})`,
				)
			}

			// If not it will be done too early
			if (runOnInit) {
				job.fireOnTick()
			}
		})
	}

	return m
}

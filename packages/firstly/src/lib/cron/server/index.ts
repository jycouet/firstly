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
	logs?: { starting?: boolean; ended?: boolean }
	start?: boolean
	runOnInit?: boolean
	timeZone?: string
	utcOffset?: string | number
	onComplete?: () => void
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

	const logJobs = (
		topic: string,
		job: CronJob<null, unknown>,
		message: string,
		with_metadata = true,
		isSuccess = true,
	) => {
		const l = []
		l.push(magenta(`[${topic}]`))
		l.push(message)
		if (with_metadata) {
			// If the job is "stopped", there will still be a next date, but it will not fire it. The job has to start.
			l.push(
				`(${job.isActive ? green('running') : red('stopped')}, next at ${yellow(job.nextDate().toISO()!)})`,
			)
		}

		if (isSuccess) {
			log.success(l.join(' '))
		} else {
			log.info(l.join(' '))
		}
	}

	m.initApi = async () => {
		jobsInfos.forEach((infos) => {
			const { topic, runOnInit, logs, concurrent, onTick: originalOnTick, ...params } = infos

			const concurrentToUse = concurrent ?? 1

			// Create a wrapper that converts the return type to void for CronJob
			const wrappedOnTick = async (): Promise<void> => {
				if (jobs[topic].concurrentInProgress < concurrentToUse) {
					jobs[topic].concurrentInProgress = jobs[topic].concurrentInProgress + 1
					const rCron = await repo(Cron).insert({ topic })
					if (logs?.starting === undefined || logs?.starting === true) {
						logJobs(topic, job, 'starting...', false, false)
					}
					const res = await originalOnTick()
					log.info(`[${topic}] result:`, res)
					rCron.result = res
					rCron.endedAt = new Date()
					rCron.status = 'ended'
					await repo(Cron).save(rCron)

					if (logs?.ended === undefined || logs?.ended === true) {
						logJobs(topic, job, 'done')
					}
					jobs[topic].concurrentInProgress = jobs[topic].concurrentInProgress - 1
				} else {
					const rCron = await repo(Cron).insert({ topic, status: 'skipped' })
					logJobs(
						topic,
						job,
						`skipped because of concurrent limit (${yellow(concurrentToUse.toString())})`,
						false,
						false,
					)
				}
			}

			// Use type assertion to bypass complex generic type issues
			const job = CronJob.from({
				...params,
				onTick: wrappedOnTick,
			} as any) as CronJob<null, unknown>

			jobs[topic] = { job, concurrentInProgress: 0 }

			logJobs(topic, job, 'setup done')

			// If not it will be done too early
			if (runOnInit) {
				job.fireOnTick()
			}
		})
	}

	return m
}

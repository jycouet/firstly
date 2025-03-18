import { CronJob } from 'cron'

import { green, magenta, red, yellow } from '@kitql/helpers'

import { Module } from '../../server'

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
 *       onTick: () => { console.log('hello') },
 *       start: !dev, // Start in production
 *       // runOnInit: dev, // nice in dev environement
 *     }])
 *   ]
 * })
 * ```
 *
 * using [cron](https://www.npmjs.com/package/cron) library under the hood
 */
export const cron: (
	jobsInfos: (Parameters<typeof CronJob.from>[0] & {
		topic: string
		concurrent?: number
		logs?: { starting?: boolean; ended?: boolean }
	})[],
) => Module = (jobsInfos) => {
	const m = new Module({
		name: 'cron',
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
			m.log.success(l.join(' '))
		} else {
			m.log.info(l.join(' '))
		}
	}

	m.initApi = async () => {
		jobsInfos.forEach((infos) => {
			const { topic, runOnInit, logs, concurrent, ...params } = infos

			const concurrentToUse = concurrent ?? 1

			const onTickSaved = params.onTick
			const fullOnTick = async () => {
				if (jobs[topic].concurrentInProgress < concurrentToUse) {
					jobs[topic].concurrentInProgress = jobs[topic].concurrentInProgress + 1
					if (logs?.starting === undefined || logs?.starting === true) {
						logJobs(topic, job, 'starting...', false, false)
					}
					// @ts-ignore
					await onTickSaved()
					if (logs?.ended === undefined || logs?.ended === true) {
						logJobs(topic, job, 'done')
					}
					jobs[topic].concurrentInProgress = jobs[topic].concurrentInProgress - 1
				} else {
					logJobs(
						topic,
						job,
						`skipped because of concurrent limit (${yellow(concurrentToUse.toString())})`,
						false,
						false,
					)
				}
			}
			params.onTick = fullOnTick

			const job = CronJob.from(params)
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

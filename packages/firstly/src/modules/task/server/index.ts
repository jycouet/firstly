import { Module } from '$lib/server'

import { Task } from '../Task'
import { TaskController } from '../TaskController'

export const task: (o: { specialInfo: string }) => Module = ({ specialInfo }) => {
	const m = new Module({
		name: 'task',
		entities: [Task],
		controllers: [TaskController],
		initApi: async () => {
			m.log.success(`Task module is ready! 🚀 (specialInfo: ${specialInfo})`)
		},
	})

	return m
}

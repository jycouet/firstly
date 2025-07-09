import { building } from '$app/environment'

import { ModuleFF } from '$lib/server'

import { Task } from '../Task'
import { TaskController } from '../TaskController'

export const task: (o: { specialInfo: string }) => ModuleFF = ({ specialInfo }) => {
	const m = new ModuleFF({
		name: 'task',
		entities: [Task],
		controllers: [TaskController],
		initApi: async () => {
			if (building) return
			m.log.success(`Task module is ready! 🚀 (specialInfo: ${specialInfo})`)
		},
	})

	return m
}

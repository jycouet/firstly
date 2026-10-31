import { sequence } from '@sveltejs/kit/hooks'

import { handleRepoClient } from '$lib/svelte/server'

import { api as handleRemult } from './server/api'

export const handle = sequence(handleRemult, handleRepoClient)

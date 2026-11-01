import kitql from '@kitql/eslint-config/.oxfmtrc.json' with { type: 'json' }

export default {
	...kitql,
	sortTailwindcss: { stylesheet: './packages/firstly/src/app.css' },
}

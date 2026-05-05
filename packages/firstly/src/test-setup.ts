import { initAsyncHooks } from 'remult/async-hooks'

// Enables AsyncLocalStorage so `withRemult({ dataProvider })` properly binds the
// data provider to the global `remult` proxy inside test callbacks. Required for
// any spec that exercises `remult.repo(...)` against an InMemoryDataProvider.
initAsyncHooks()

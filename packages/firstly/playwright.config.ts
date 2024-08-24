import type { PlaywrightTestConfig, ReporterDescription } from '@playwright/test'

const getConfig = (
  isCI: any | undefined,
  config: { webServer_port: number; webServer_timeout?: number },
): PlaywrightTestConfig => {
  const reporter: ReporterDescription[] = [['list'], ['html', { open: 'on-failure' }]]
  if (isCI) {
    reporter.push(['github'])
  }

  return {
    // retries: 0, // default
    // workers: 50%, // default
    testMatch: '*e2e.ts',
    reporter,
    use: { screenshot: 'only-on-failure' },
    webServer: {
      // command: `pnpm vite build --mode test && pnpm vite preview --port ${config.webServer_port}`,
      // command: `pnpm vite preview --mode test --port ${config.webServer_port}`,
      command: `pnpm vite dev --mode test --port ${config.webServer_port}`,
      port: config.webServer_port,
      timeout: config.webServer_timeout ?? 180_000, // time for build and run preview!
      stdout: 'pipe',
    },
    timeout: 10_000,
    expect: {
      toMatchSnapshot: {
        threshold: 0.4,
      },
    },
  }
}

export default getConfig(process.env.CI, {
  webServer_port: 4142,
})

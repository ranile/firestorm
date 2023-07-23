import type { PlaywrightTestConfig } from '@playwright/test';

export default {
    webServer: {
        command: 'npm run dev',
        port: 5173,
        reuseExistingServer: true
    },
    testDir: 'playwright/tests'
} satisfies PlaywrightTestConfig;

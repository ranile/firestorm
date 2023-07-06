import type { PlaywrightTestConfig } from '@playwright/test';

export default {
    webServer: {
        command: 'npm run preview',
        port: 4173,
        reuseExistingServer: true
    },
    testDir: 'playwright/tests'
} satisfies PlaywrightTestConfig;

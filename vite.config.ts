import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
    plugins: [wasm(), topLevelAwait(), sveltekit()],
    server: {
        fs: {
            allow: ['crates/moe/pkg']
        },
        proxy: {
            '/api/push-notify': {
                target: 'http://localhost:54321/functions/v1/push-notify/',
                rewrite: (path) => path.replace(/^\/api\/push-notify/, '')
            }
        }
    },
    test: {
        include: ['src/**/*.{js,ts}']
    },
    define: {
        'import.meta.vitest': 'undefined'
    }
});

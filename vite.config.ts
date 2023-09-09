import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
    plugins: [wasm(), topLevelAwait(), sveltekit()],
    server: {
        fs: {
            allow: ['crates/moe/pkg']
        }
    },
    test: {
        include: ['src/**/*.spec.{js,ts}']
    },
    define: {
        'import.meta.vitest': 'undefined'
    }
});

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
    assetsInclude: ['crates/moe/dist/*'],
    plugins: [wasm(), topLevelAwait(), sveltekit()],
    server: {
        fs: {
            allow: [
                'crates/moe/pkg',
                'crates/moe/dist/worker',
                'crates/moe/dist/decrypt_attachment_worker'
            ]
        }
    },
    test: {
        include: ['src/**/*.{js,ts}']
    },
    define: {
        'import.meta.vitest': 'undefined'
    }
});

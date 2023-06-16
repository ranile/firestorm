/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/**/*.{html,js,svelte,ts}',
        './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
    ],
    theme: {
        extend: {
            minWidth: {
                'auth-card': '32rem'
            },
            brightness: {
                80: '.80',
            }
        }
    },
    plugins: [require('flowbite/plugin')],
    darkMode: 'class'
};

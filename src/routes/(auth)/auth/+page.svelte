<script lang="ts">
    import type { PageData } from './$types';
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import SignIn from './SignIn.svelte';
    import SignUp from './SignUp.svelte';
    import { view } from './utils';

    export let data: PageData;

    $: {
        // IMPORTANT: detect login was successful
        // supabase sveltekit auth ui does not work otherwise
        const hasSession = data?.session;
        if (hasSession && browser) {
            goto('/');
        }
    }
</script>

<div class="flex w-full md:h-full">
    <div
        class="rounded-lg shadow mx-auto md:my-auto sm:max-w-md md:border md:dark:border-gray-700 space-y-4 md:space-y-6 p-8"
    >
        {#if $view === 'sign-in'}
            <SignIn supabase={data.supabase} />
        {:else if $view === 'sign-up'}
            <SignUp supabase={data.supabase} />
        {/if}
    </div>
</div>

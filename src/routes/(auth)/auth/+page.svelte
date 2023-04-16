<script lang="ts">
    import type { PageData } from './$types';
    import { Auth } from '@supabase/auth-ui-svelte'
    import { ThemeSupa } from '@supabase/auth-ui-shared'
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';

    export let data: PageData;


    $: {
        // IMPORTANT: detect login was successful
        // supabase sveltekit auth ui does not work otherwise
        const hasSession = data?.session;
        if (hasSession) {
            goto('/');
        }
    }
</script>

<div class="w-2/6 m-auto">
    <Auth supabaseClient={data.supabase} appearance={{ theme: ThemeSupa }} />
</div>

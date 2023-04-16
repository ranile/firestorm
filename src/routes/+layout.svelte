<script lang="ts">
    import "../app.css";

    import {goto, invalidate} from '$app/navigation';
    import { onMount } from 'svelte';
    import type { LayoutData } from './$types';
    import {browser} from "$app/environment";

    export let data: LayoutData;

    $: ({ supabase, session } = data);

    $: {
        // IMPORTANT: detect login was successful
        // supabase sveltekit auth ui does not work otherwise
        const hasSession = data?.session
        if (browser) {
            if (hasSession) {
                console.log('hasSession')
                if (browser) {
                    goto('/')
                }
            } else {
                goto('/auth')
            }
        }
    }

    onMount(() => {
        const {
            data: { subscription },
        } = data.supabase.auth.onAuthStateChange((event, _session) => {
            if (_session?.expires_at !== session?.expires_at) {
                invalidate('supabase:auth');
            }
        });

        return () => subscription.unsubscribe();
    });
</script>

<slot />
<script>
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import { machine } from '$lib/e2ee';

    onMount(() => {
        if (browser) {
            // Starts listening for requests

        }
    });
</script>
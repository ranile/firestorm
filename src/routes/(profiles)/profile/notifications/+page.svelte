<script lang="ts">
    import { Button } from 'flowbite-svelte';
    import { subscribeToNotifications } from '$lib/notifications';
    import type { PageData } from './$types';

    export let data: PageData;

    const enableNotifications = () => {
        Notification.requestPermission().then(result => {
            if (result === 'granted') {
                subscribeToNotifications(data.supabase, data.session).then(() => {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification('Notification with ServiceWorker');
                    });
                });
            }
        });
    }
</script>

<Button on:click={enableNotifications}>Enable Notifications</Button>
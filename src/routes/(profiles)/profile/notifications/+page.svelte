<script lang="ts">
    // pub key generated using openssl with the following command
    // openssl ec -in private.pem -pubout -outform DER|tail -c 65|base64|tr '/+' '_-'|tr -d '\n'
    import { PUBLIC_VAPID_PUBLIC_KEY as VAPID_PUBLIC_KEY } from '$env/static/public'
    import { Button } from 'flowbite-svelte';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';
    export let data: PageData;
    function urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    const unsubHandler = async () => {
        console.log('unsub');
        const registration = await navigator.serviceWorker.getRegistration();
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
            await sub.unsubscribe();
        }
    }
    const subHandler = async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        console.log('handler handling ', registration, subscription)
        let response = await fetch('/api/push-notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`
            },
            body: JSON.stringify(subscription)
        });

        console.log(response);

    }

    const enableNotifications = () => {
        Notification.requestPermission().then(result => {
            if (result === 'granted') {
                subHandler().then(() => {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification('Notification with ServiceWorker');
                    });
                });
            }
        });
    }
</script>

<Button on:click={enableNotifications}>Enable Notifications</Button>
<script lang="ts">
    // pub key generated using openssl with the following command
    // openssl ec -in private.pem -pubout -outform DER|tail -c 65|base64|tr '/+' '_-'|tr -d '\n'
    import { PUBLIC_VAPID_PUBLIC_KEY as VAPID_PUBLIC_KEY } from '$env/static/public'
    import { Button } from 'flowbite-svelte';
    import { onMount } from 'svelte';
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
        let response = await fetch('/api/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscription)
        });

        console.log(response);

    }

    onMount(() => {
        subHandler()
    })
</script>

<Button on:click={subHandler}>do me</Button>
<Button on:click={unsubHandler}>fuck</Button>
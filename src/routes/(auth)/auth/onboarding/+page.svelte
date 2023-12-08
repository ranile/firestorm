<script lang="ts">
    import { Button, Helper } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import ProfileUpdate from '$lib/components/ProfileUpdate.svelte';
    import { init, machine } from '$lib/e2ee';

    export let data: PageData;

    let username = '';
    let errorMessage = '';
    let avatarFile: File | undefined = undefined;

    const getStartedClick = async () => {
        if (username === '') {
            return;
        }
        const userId = data.session!.user.id;
        try {
            const deviceId = crypto.randomUUID();
            localStorage.setItem('deviceId', deviceId);
            // await updateProfile(data.supabase, userId, username, avatarFile);
            const { curve25519, ed25519 } = machine.identityKeys;
            init(userId, deviceId);

            const otk = machine.getOneTimeKeys(50);
            console.log(otk);
            await fetch('/auth/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deviceId,
                    username,
                    identityKeys: {
                        curve25519,
                        ed25519,
                    },
                    oneTimeKeys: otk
                }),
            });
            await goto('/');

        } catch (e) {
            if (e instanceof Error) {
                errorMessage = e.message;
            }
        }
    };
</script>

<div class="flex w-full md:h-full">
    <main class="flex flex-col mx-auto md:my-auto min-w-auth-card gap-4">
        <h1 class="self-center font-bold text-xl p-5 uppercase">Welcome</h1>
        <ProfileUpdate bind:username bind:avatarFile />
        <Button on:click={getStartedClick}>Get Started</Button>
        {#if errorMessage !== ''}
            <Helper class="mt-2" color="red">
                <span class="font-medium">
                    {errorMessage} <br />
                    Contact support.
                </span>
            </Helper>
        {/if}
    </main>
</div>

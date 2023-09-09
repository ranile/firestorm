<script lang="ts">
    import { Button, Helper } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import { updateProfile } from '$lib/db/users';
    import ProfileUpdate from '$lib/components/ProfileUpdate.svelte';
    import { olmAccount as olmAccountStore } from '$lib/utils';
    import { init, machine } from '$lib/e2ee';
    import { page } from '$app/stores';
    import { trpc } from '$lib/trpc/client';

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
            // await updateProfile(data.supabase, userId, username, avatarFile);
            init(userId, 'device_id' + performance.now());
            // const oneTimeKeys = olmAccount.generateOneTimeKeys(10);
            const { curve25519, ed25519 } = machine.identityKeys;

            await trpc($page).users.updateProfile.mutate({
                userId,
                identityKeys: {
                    curve25519,
                    ed25519,
                },
                oneTimeKeys: []
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

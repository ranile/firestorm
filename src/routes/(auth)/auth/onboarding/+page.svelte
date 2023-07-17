<script lang="ts">
    import { Button, Helper } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import { updateProfile } from '$lib/db/users';
    import ProfileUpdate from '$lib/components/ProfileUpdate.svelte';
    import { UserAccount } from 'moe';
    import { olmAccount as olmAccountStore } from '$lib/utils';

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
            await updateProfile(data.supabase, userId, username, avatarFile);
            const olmAccount = new UserAccount();
            const oneTimeKeys = olmAccount.generateOneTimeKeys(10);
            const { curve25519, ed25519 } = olmAccount.identityKeys();

            const idKeys = await data.supabase
                .from('user_identity_keys')
                .insert({ id: userId, curve25519, ed25519 });

            const rows = [];
            for (const [id, key] of oneTimeKeys) {
                rows.push({ id: userId, key_id: id, curve25519: key });
            }

            const otk = await data.supabase.from('user_one_time_keys').insert(rows);

            olmAccount.markKeysAsPublished();

            const arr = new Uint8Array(32);
            crypto.getRandomValues(arr);
            const pickle = olmAccount.to_pickle(arr);

            localStorage.setItem(
                'account:pickle',
                JSON.stringify({
                    pickle,
                    key: [...arr]
                })
            );
            olmAccountStore.set(olmAccount);
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

<script lang="ts">
    import { Button, Input, Avatar, Helper } from 'flowbite-svelte';
    import PlusCircle from 'svelte-material-icons/PlusCircle.svelte';
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import { updateProfile } from '$lib/db/users';

    export let data: PageData;

    let username = '';
    let files: FileList | undefined = undefined;
    let fileInput: HTMLInputElement;
    const imageUploadClicked = () => {
        fileInput.click();
    };
    let errorMessage = '';
    let inputErrorMessage = '';


    const getStartedClick = async () => {
        if (username === '') {
            inputErrorMessage = 'Username is required';
            return;
        }
        const userId = data.session!.user.id;
        try {
            await updateProfile(data.supabase, userId, username, files?.item(0));
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
        <div class="flex gap-4 w-full">
            <section class="flex items-center">
                <input
                    type="file"
                    class="hidden"
                    bind:files
                    bind:this={fileInput}
                    accept="image/*"
                />
                <Button btnClass="relative" on:click={imageUploadClicked}>
                    <Avatar class="h-14 w-14" />
                    <PlusCircle class="absolute -bottom-1 -right-0 h-6 w-6" />
                </Button>
            </section>
            <section class="flex flex-col w-full">
                <h2 class="py-4">Choose a username</h2>
                <Input bind:value={username} placeholder="Username" required />
                {#if inputErrorMessage !== ''}
                    <Helper class="mt-2" color="red">
                        <span class="font-medium">{inputErrorMessage}</span>
                    </Helper>
                {/if}
            </section>
        </div>
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

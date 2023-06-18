<script lang="ts">
    import { Button, Input, Avatar, Helper } from 'flowbite-svelte';
    import PlusCircle from 'svelte-material-icons/PlusCircle.svelte';
    import { profile } from '$lib/db/users';
    import { onDestroy } from 'svelte';

    export let username = '';
    export let avatarFile: File | undefined = undefined;

    let files: FileList | undefined = undefined;
    let fileInput: HTMLInputElement;

    let avatarPreview: string | undefined = $profile?.avatar ?? undefined;

    const imageUploadClicked = () => {
        fileInput.click();
    };
    let errorMessage = '';
    let inputErrorMessage = '';

    $: {
        if (username === '') {
            inputErrorMessage = 'Username is required';
        }
    }

    $: {
        if (files !== undefined && files.length !== 0) {
            avatarFile = files[0];
            const previousUrl = avatarPreview;
            avatarPreview = URL.createObjectURL(avatarFile);
            if (previousUrl?.startsWith('blob:') === true) {
                URL.revokeObjectURL(previousUrl);
            }
        }
    }

    onDestroy(() => {
        if (avatarPreview?.startsWith('blob:') === true) {
            URL.revokeObjectURL(avatarPreview);
        }
    });
</script>

<div class="flex gap-4 w-full">
    <section class="flex items-center">
        <input type="file" class="hidden" bind:files bind:this={fileInput} accept="image/*" />
        <Button btnClass="relative" on:click={imageUploadClicked}>
            <Avatar class="h-14 w-14" src={avatarPreview} />
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
{#if errorMessage !== ''}
    <Helper class="mt-2" color="red">
        <span class="font-medium">
            {errorMessage} <br />
            Contact support.
        </span>
    </Helper>
{/if}

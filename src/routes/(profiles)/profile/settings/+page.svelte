<script lang='ts'>
    import { Input } from 'flowbite-svelte';
    import Check from 'svelte-material-icons/Check.svelte';
    import { profile, updateProfile } from '$lib/db/users';
    import ProfileUpdate from '$lib/components/ProfileUpdate.svelte';

    export let data;

    let username = $profile?.username ?? '';
    let avatarFile: File | undefined = undefined;

    $: console.log({ initial: $profile?.username, username, avatarFile });

    let needsSaving = false;
    $: {
        needsSaving = username !== $profile?.username || avatarFile !== undefined;
    }

    const saveChanges = async () => {
        await updateProfile(data.supabase, $profile!.id, $profile?.username === username ? undefined : username, avatarFile);
        needsSaving = false;
    };
</script>

<div class='grid md:w-1/2 h-3/4'>
    <div class='flex flex-col gap-2'>
        <h4 class='font-bold text-lg'>Profile</h4>
        <ProfileUpdate bind:username bind:avatarFile />
    </div>
    <div />
    {#if needsSaving}
        <!-- classes copied from flowbite button -->
        <button
            class='self-end text-center font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 rounded-full'
            on:click={saveChanges}
        >
            <Check size='1.4em' />
            Save Changes
        </button>
    {/if}
</div>

<style>
    div.grid {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr 1fr 1fr;
    }
</style>

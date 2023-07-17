<script lang="ts">
    import type { PageData } from './$types';
    import { Avatar, Button, Input, Label, Modal } from 'flowbite-svelte';
    import Plus from 'svelte-material-icons/AccountPlus.svelte';
    import { inviteMember } from '$lib/db/rooms';
    import { findUser } from '$lib/db/users';
    import { olmAccount, raise } from '$lib/utils.js';

    export let data: PageData;

    let inviteMemberDialog = false;

    const showInviteMemberDialog = () => {
        inviteMemberDialog = true;
    };
    const onInviteSubmit = async (e: SubmitEvent) => {
        const formData = new FormData(e.target as HTMLFormElement);
        const who = formData.get('who') as string;
        const user = await findUser(data.supabase, who);
        await inviteMember(data.supabase, $olmAccount ?? raise("olm account must be initialized"), data.room.id, user.id!);
        alert(`invited ${user.username} (${user.email}) to ${data.room.name}`);
        console.log(user);
    };
</script>

<div class="flex flex-col items-start gap-4">
    <Button pill={true} class="my-2" on:click={showInviteMemberDialog}>
        <Plus class="mr-2 text-base" />
        Invite
    </Button>
    <ul>
        {#each data.members as member (member.id)}
            <li class="flex items-center gap-2 my-1 py-2">
                <Avatar src={member.avatar ?? undefined} />
                <span>
                    {member.username}
                    {#if member.join_state === 'invited'}
                        (invited)
                    {/if}
                </span>
            </li>
        {/each}
    </ul>
</div>

<Modal bind:open={inviteMemberDialog} size="md" autoclose={false} class="w-full">
    <form class="flex flex-col space-y-6" on:submit|preventDefault={onInviteSubmit}>
        <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">
            Invite by email or username
        </h3>
        <Label class="space-y-2">
            <span>Email or username</span>
            <Input type="text" name="who" placeholder="name" required />
        </Label>
        <Button type="submit" class="w-full1">Invite</Button>
    </form>
</Modal>

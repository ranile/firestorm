<script lang="ts">
    import { Button, Modal, Label, Input, Helper } from 'flowbite-svelte';
    import { createRoomModalState } from './store';
    import { createRoom } from '$lib/db/rooms';
    import { goto } from '$app/navigation';

    let name = '';
    let onCreateClick = async () => {
        const { room } = await createRoom(name);
        await goto(`/room/${room.id}`);
        createRoomModalState.set(false);
    };
</script>

<Modal bind:open={$createRoomModalState} size="xs" class="w-full">
    <form class="flex flex-col space-y-6" action="#" on:submit|preventDefault={onCreateClick}>
        <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Create a room</h3>
        <Label class="space-y-2">
            <span>Name</span>
            <Input
                bind:value={name}
                name="name"
                placeholder="What do you want to call your room?"
                max={64}
                required
            />
            <Helper class="text-sm mt-2">
                <span class="text-gray-500 dark:text-gray-400">Max 64 characters</span>
            </Helper>
        </Label>
        <Button type="submit" class="w-full1">Create</Button>
    </form>
</Modal>

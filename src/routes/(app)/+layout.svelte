<script lang="ts">
    import { SidebarItem, Button, SidebarGroup } from 'flowbite-svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import ProfileDropdown from '$lib/components/ProfileDropdown.svelte';
    import { onMount } from 'svelte';
    import {
        getRooms,
        subscribeToRoomMembers,
        getRoomMemberForRoom,
        getRoomById
    } from '$lib/db/rooms';
    import { getUserProfile, profile } from '$lib/db/users';
    import { rooms } from '$lib/db/rooms';
    import { createRoomModalState } from '$lib/components/SideNav/store';
    import SideNavGeneric from '$lib/components/SideNavGeneric.svelte';
    import { page } from '$app/stores';
    import type { LayoutData } from './$types';
    import { goto, invalidate } from '$app/navigation';
    import { splitWith } from '../../lib/utils';
    import CreateRoomModal from '$lib/components/SideNav/CreateRoomModal.svelte';
    import type { Room } from '../../lib/db/rooms';
    import type { RealtimeChannel } from '@supabase/supabase-js';

    export let data: LayoutData;
    const signout = () => {
        data.supabase.auth.signOut();
    };

    const handleRoomMemberChange = (payload: any) => {
        console.log('invalidating');
        invalidate('rooms:load')
    };

    onMount(() => {
        let sub: RealtimeChannel | undefined;
        if (data.session) {
            sub = subscribeToRoomMembers(
                data.supabase,
                handleRoomMemberChange,
                data.session.user.id
            );
        }

        return () => sub?.unsubscribe();
    });

    $: activeUrl = $page.url.pathname;
    $: currentRoom = $rooms.find((room) => room.id === data.currentRoomId) ?? null;
</script>

<SideNavGeneric>
    <svelte:fragment slot="navbar">
        {#if currentRoom !== null}
            <button
                class="text-2xl font-bold px-4 py-2"
                on:click={() => goto(`/room/${currentRoom?.id ?? ''}/settings/overview`)}
            >
                {currentRoom.name}
            </button>
        {/if}
    </svelte:fragment>

    <svelte:fragment slot="sidebar-header">
        <ProfileDropdown {signout} />
        <Button pill={true} on:click={() => createRoomModalState.set(true)}>
            <Plus />
        </Button>
    </svelte:fragment>

    <svelte:fragment slot="sidebar-content">
        {#each data.joined as room (room.id)}
            <SidebarItem
                label={room.name}
                href={`/room/${room.id}`}
                spanClass="pl-2 self-center text-md text-gray-900 whitespace-nowrap dark:text-white"
                active={activeUrl === `/room/${room.id}`}
            />
        {/each}
    </svelte:fragment>

    <svelte:fragment slot="sidebar-extras">
        {#if data.invited.length !== 0}
            <SidebarGroup border>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Invites</h3>

                {#each data.invited as room (room.id)}
                    <SidebarItem
                        label={room.name}
                        href={`/room/${room.id}`}
                        spanClass="pl-2 self-center text-md text-gray-900 whitespace-nowrap dark:text-white"
                        active={activeUrl === `/room/${room.id}`}
                    />
                {/each}
            </SidebarGroup>
        {/if}
    </svelte:fragment>
    <slot />
</SideNavGeneric>

<CreateRoomModal />

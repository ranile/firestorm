<script lang="ts">
    import { Button } from 'flowbite-svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import ProfileDropdown from '$lib/components/ProfileDropdown.svelte';
    import { onMount } from 'svelte';
    import { subscribeToRoomMembers } from '$lib/db/rooms';
    import { rooms } from '$lib/db/rooms';
    import { createRoomModalState } from '$lib/components/SideNav/store';
    import SideNavGeneric from '$lib/components/SideNavGeneric.svelte';
    import { page } from '$app/stores';
    import type { LayoutData } from './$types';
    import { goto, invalidate } from '$app/navigation';
    import CreateRoomModal from '$lib/components/SideNav/CreateRoomModal.svelte';
    import SidebarItem from '$lib/components/SideNav/SidebarItem.svelte';
    import type { RealtimeChannel } from '@supabase/supabase-js';
    import { decryptMessage } from './room/[room]/authors.ts';

    export let data: LayoutData;
    const signout = () => {
        data.supabase.auth.signOut();
    };

    const handleRoomMemberChange = (payload: any) => {
        console.log('invalidating');
        invalidate('rooms:load');
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
    $: joined = $rooms.filter((room) => room.membership.join_state === 'joined');
    $: invited = $rooms.filter((room) => room.membership.join_state === 'invited');

    onMount(() => {
        const notificationChannel = new BroadcastChannel('notifications');
        notificationChannel.addEventListener('message', (event) => {
            const request = event.data;
            if (request.op === 'decrypt') {
                const content = request.content;
                decryptMessage(data.supabase, {
                    room_id: content.room.id,
                    ...content
                }).then(plaintext => {
                    notificationChannel.postMessage({
                        op: 'notify',
                        content: plaintext,
                    });
                })

            }
        })

    })
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
        {#each joined as room (room.id)}
            <SidebarItem
                label={room.name}
                href={`/room/${room.id}`}
                active={activeUrl === `/room/${room.id}`}
            />
        {/each}
    </svelte:fragment>

    <svelte:fragment slot="sidebar-extras">
        {#if invited.length !== 0}
            <hr />
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Invites</h3>

            {#each invited as room (room.id)}
                <SidebarItem
                    label={room.name}
                    href={`/room/${room.id}`}
                    active={activeUrl === `/room/${room.id}`}
                />
            {/each}
        {/if}
    </svelte:fragment>
    <slot />
</SideNavGeneric>

<CreateRoomModal />

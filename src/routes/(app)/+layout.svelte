<script lang="ts">
    import { Button } from 'flowbite-svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import ProfileDropdown from '$lib/components/ProfileDropdown.svelte';
    import { onMount } from 'svelte';
    import { saveSharedKeys, subscribeToRoomMembers } from '$lib/db/rooms';
    import { rooms } from '$lib/db/rooms';
    import { createRoomModalState } from '$lib/components/SideNav/store';
    import SideNavGeneric from '$lib/components/SideNavGeneric.svelte';
    import { page } from '$app/stores';
    import type { LayoutData } from './$types';
    import { goto, invalidate } from '$app/navigation';
    import CreateRoomModal from '$lib/components/SideNav/CreateRoomModal.svelte';
    import SidebarItem from '$lib/components/SideNav/SidebarItem.svelte';
    import type { RealtimeChannel } from '@supabase/supabase-js';
    import { decryptMessage } from './room/[room]/authors';
    import { olmAccount, raise } from '$lib/utils';
    import type { Database } from '../../database';
    import { getKeyRequests, getSharedKeys } from '$lib/db/keys';
    import { shareRoomKey } from '$lib/e2ee';

    export let data: LayoutData;
    const signout = () => {
        data.supabase.auth.signOut();
    };

    const handleRoomMemberChange = () => {
        console.log('invalidating');
        rooms.set([]);
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
                }).then((plaintext) => {
                    notificationChannel.postMessage({
                        op: 'notify',
                        content: plaintext
                    });
                });
            }
        });
    });

    // listen for key requests (room_session_key_requests) -- if we got the key, share it
    // listen for key shares (room_session_keys) -- accept the key
    // ----

    onMount(() => {
        getKeyRequests(data.supabase).then(async (requests) => {
            console.log('read key requests', requests);

            for (const request of requests) {
                const keys = await shareRoomKey(request.room_id, [request.requester_user_id])
                console.log('shared keys', keys);
                await saveSharedKeys(data.supabase, data.session, request.room_id, keys)
                await data.supabase.from('room_session_key_requests').delete()
                    .eq('requested_from', request.requested_from)
                    .eq('requester_user_id', request.requester_user_id)
                    .eq('room_id', request.room_id)

            }
        })

        getSharedKeys(data.supabase, localStorage.getItem('deviceId')!)
            .then((keys) => {
                console.log('got keys to accept', keys);
                // TODO: accept this key
            })

        console.info('subscribing to keys');
        const sub = data.supabase
            .channel(`key-requests`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'room_session_key_requests',
                    filter: `requested_from=eq.${data.session?.user.id}`
                },
                (event) => {
                    if (event.eventType === 'INSERT') {
                        console.log('got key request', event);
                        // share the key
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'room_session_keys',
                    filter: `key_for_user=eq.${data.session?.user.id}`
                },
                (event) => {

                    if (event.eventType === 'INSERT') {
                        console.log('time to share key', event);
                        // accept the key
                    }
                }
            )

            .subscribe();
        return () => sub.unsubscribe();
    });
</script>

<SideNavGeneric>
    <svelte:fragment slot="navbar">
        {#if currentRoom !== null}
            <button
                class="text-2xl font-bold px-4 py-2 wrap-anywhere"
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
            <span class="sr-only">Create room</span>
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

    <svelte:fragment slot="body">
        <slot />
    </svelte:fragment>
</SideNavGeneric>

<CreateRoomModal />

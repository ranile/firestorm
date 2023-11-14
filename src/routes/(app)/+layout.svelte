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
    import { decryptMessage } from './room/[room]/authors';
    import { olmAccount, raise } from '$lib/utils';
    import type { Database } from '../../database';

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

    onMount(() => {
        // TODO:
        // listen for key requests (room_session_key_requests) -- if we got the key, share it
        // listen for key shares (room_session_keys) -- accept the key
        // ----

        type Request = Database['public']['Tables']['room_session_key_requests']['Row'];

        function handleRequest(request: Request) {

            // shareMySessionKey(
            //     data.supabase,
            //     $olmAccount ?? raise('olm account must be set'),
            //     request.room_id,
            //     request.requested_by
            // );
            // data.supabase
            //     .from('room_session_key_requests')
            //     .delete()
            //     .eq('room_id', request.room_id)
            //     .eq('requested_from', request.requested_from)
            //     .eq('requested_by', request.requested_by);
        }

        (async () => {
            const { data: requests, error } = await data.supabase
                .from('room_session_key_requests')
                .select('*')
                .eq('requested_from', data.session?.user.id);
            if (error) {
                console.error(error);
                return;
            }

            requests.forEach((request) => {
                handleRequest(request);
            });
        })();

        console.info('subscribing to key requests');
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
                    console.log('got key request', event);
                    if (event.eventType === 'INSERT') {
                        handleRequest(event.new as Request);
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

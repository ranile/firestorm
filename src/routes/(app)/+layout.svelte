<script lang='ts'>
    import { SidebarItem, Button, SidebarGroup } from 'flowbite-svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import ProfileDropdown from '$lib/components/ProfileDropdown.svelte';
    import { onMount } from 'svelte';
    import { getRooms, subscribeToRoomMembers, getRoomMemberForRoom, getRoomById } from '$lib/db/rooms';
    import { getUserProfile, profile } from '$lib/db/users';
    import { rooms } from '$lib/db/rooms';
    import { currentRoom } from '$lib/utils';
    import { createRoomModalState } from '$lib/components/SideNav/store';
    import SideNavGeneric from '$lib/components/SideNavGeneric.svelte';
    import { page } from '$app/stores';
    import type { LayoutData } from './$types';
    import { goto } from '$app/navigation';
    import { splitWith } from '../../lib/utils';
    import CreateRoomModal from '$lib/components/SideNav/CreateRoomModal.svelte';

    export let data: LayoutData;
    const signout = () => {
        data.supabase.auth.signOut();
    };

    let joinedRooms = [];
    let invites = [];


    $: if (data.session) {
        getRooms(data.supabase).then(r => {
            rooms.set(r);
        });
        getUserProfile(data.supabase, data.session).then(p => {
            profile.set({ ...p, email: data.session.user.email });
        });
    }

    $: if (data.session) {
        joinedRooms = $rooms;
        splitWith($rooms, (room) => getRoomMemberForRoom(data.supabase, room.id, data.session.user.id).then(m => m.join_state === 'joined'))
            .then(([joined, invited]) => {
                joinedRooms = joined;
                invites = invited;
            })
            .catch(e => console.error(e));
    }

    const handleRoomMemberChange = (payload) => {
        console.log(payload);
        const { new: newRecord, old: oldRecord, eventType } = payload;
        if (eventType === 'INSERT') {
            getRoomById(data.supabase, newRecord.room_id).then((fetchedRoom) => {
                rooms.update((r) => [...r, fetchedRoom]);
            });
        } else if (eventType === 'DELETE') {
            rooms.update(r => r.filter(room => room.id !== oldRecord.room_id));
        } else if (eventType === 'UPDATE') {
            if (newRecord.join_state === 'joined' && oldRecord.join_state === 'invited') {
                const room = invites.find(it => it.id === newRecord.room_id);
                invites = invites.filter(it => it.id !== newRecord.room_id);
                joinedRooms = [...joinedRooms, room];
            }
        }
    };

    onMount(() => {
        let sub;
        if (data.session) {
            sub = subscribeToRoomMembers(data.supabase, handleRoomMemberChange, data.session.user.id);
        }

        return () => sub?.unsubscribe();
    });

    $: activeUrl = $page.url.pathname;

</script>

<SideNavGeneric>
    <svelte:fragment slot='navbar'>
        {#if $currentRoom !== null}
            <button class='text-2xl font-bold px-4 py-2' on:click={() => goto(`/room/${$currentRoom.id}/settings`)}>
                {$currentRoom.name}
            </button>
        {/if}
    </svelte:fragment>

    <svelte:fragment slot='sidebar-header'>
        <ProfileDropdown signout={signout} />
        <Button pill={true} on:click={() => createRoomModalState.set(true)}>
            <Plus />
        </Button>
    </svelte:fragment>

    <svelte:fragment slot='sidebar-content'>
        {#each joinedRooms as room (room.id)}
            <SidebarItem
                label={room.name}
                href={`/room/${room.id}`}
                spanClass='pl-2 self-center text-md text-gray-900 whitespace-nowrap dark:text-white'
                active={activeUrl === `/room/${room.id}`}
            />
        {/each}
    </svelte:fragment>

    <svelte:fragment slot='sidebar-extras'>
        {#if invites.length !== 0}
            <SidebarGroup border>
                <h3 class='text-sm font-medium text-gray-500 dark:text-gray-400'>Invites</h3>

                {#each invites as room (room.id)}
                    <SidebarItem
                        label={room.name}
                        href={`/room/${room.id}`}
                        spanClass='pl-2 self-center text-md text-gray-900 whitespace-nowrap dark:text-white'
                        active={activeUrl === `/room/${room.id}`}
                    />
                {/each}
            </SidebarGroup>
        {/if}
    </svelte:fragment>
    <slot />

</SideNavGeneric>

<CreateRoomModal />

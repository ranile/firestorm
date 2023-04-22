<script lang='ts'>
    import SideNav from '$lib/components/SideNav/SideNav.svelte';
    import type { LayoutData } from './$types';
    import { onMount } from 'svelte';
    import { getRooms, subscribeToRoomMembers, getRoomById } from '$lib/db/rooms';
    import { getUserProfile, profile } from '$lib/db/users';
    import { rooms } from '../../lib/db/rooms';

    export let data: LayoutData;
    const signout = () => {
        data.supabase.auth.signOut();
    };

    $: if (data.session) {
        getRooms(data.supabase).then(r => {
            rooms.set(r);
        });
        getUserProfile(data.supabase, data.session).then(p => {
            profile.set({ ...p, email: data.session.user.email });
        });
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
        }
    };

    onMount(() => {
        let sub;
        if (data.session) {
            sub = subscribeToRoomMembers(data.supabase, handleRoomMemberChange, data.session.user.id);
        }

        return () => sub?.unsubscribe();
    });
</script>


<SideNav {signout}>
    <slot />
</SideNav>

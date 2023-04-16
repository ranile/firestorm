<script lang='ts'>
  import SideNav from '$lib/components/SideNav.svelte';
  import type { LayoutData } from './$types';
  import { onMount } from 'svelte';
  import { getRooms, subscrieToRoomMembers, getRoomById } from '$lib/db/rooms';

  export let data: LayoutData;

  let rooms = [];

  $: if (data.session) {
    getRooms(data.supabase).then(r => {
      rooms = r;
    });
  }

  const handleRoomMemberChange = (payload) => {
    console.log(payload);
    const { new: newRecord, old: oldRecord, eventType } = payload;
    if (eventType === 'INSERT') {
      getRoomById(data.supabase, newRecord.room_id).then((fetchedRoom) => {
        rooms = [...rooms, fetchedRoom];
      });
    } else if (eventType === 'DELETE') {
      rooms = rooms.filter(room => room.id !== oldRecord.room_id);
    }
  };
  onMount(() => {
    let sub;
    if (data.session) {
      sub = subscrieToRoomMembers(data.supabase, data.session.user.id, handleRoomMemberChange);
    }

    return () => sub?.unsubscribe();
  });
</script>


<SideNav {rooms}>
  <slot />
</SideNav>

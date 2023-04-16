<script lang="ts">
    import type {PageData} from './$types';
    import {onMount} from "svelte";
    import {REALTIME_LISTEN_TYPES} from "@supabase/realtime-js/src/RealtimeChannel";

    export let data: PageData;

    let rooms = [];
    async function loadData() {
        const {data: fetchedRooms} = await data.supabase.from('rooms').select('*');
        rooms = fetchedRooms ?? [];
    }

    $: if (data.session) {
        loadData();
    }

    const signout = () => {
        data.supabase.auth.signOut()
    }

    const handleRoomMemberChange = (payload) => {
        console.log(payload)
        const {new: newRecord, old: oldRecord, eventType} = payload;
        if (eventType === 'INSERT') {
            const newRoomId = newRecord.room_id
            data.supabase.from('rooms').select('*').eq('id', newRoomId).then(({data: fetchedRooms}) => {
                rooms = [...rooms, ...fetchedRooms];
            });
        } else if (eventType === 'DELETE') {
            rooms = rooms.filter(room => room.id !== oldRecord.room_id);
        }
    };
    onMount(() => {
        console.log(`member_id=eq.${data.session.user.id}`)
        const sub = data.supabase.channel('table-db-changes')
            .on(REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
                {
                    event: '*',
                    schema: 'public',
                    table: 'room_members',
                    filter: `member_id=eq.${data.session.user.id}`
                },
                (payload) => handleRoomMemberChange(payload)
            )
            .subscribe();

        return () => sub.unsubscribe()
    })
</script>


<h1 class="text-3xl font-bold underline">
    Hello Svelte!
</h1>


{#if data.session}
    <p>client-side data fetching with RLS</p>
    <pre>{JSON.stringify(rooms, null, 2)}</pre>
    <button on:click={signout}>sign out</button>
{/if}

<style lang="postcss">
    :global(html) {
        background-color: theme(colors.gray.100);
    }
</style>
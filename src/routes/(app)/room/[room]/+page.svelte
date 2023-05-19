<script lang='ts'>
    import type { PageData } from './$types';
    import { Button, Textarea, ToolbarButton } from 'flowbite-svelte';
    import { type AuthoredMessage, createMessage, subscribeToRoomMessages } from '$lib/db/messages';
    import MessageList from './MessageList.svelte';
    import type { Message } from '$lib/db/messages';
    import { joinRoom } from '$lib/db/rooms';
    import { OutboundSession } from 'moe';
    import { browser } from '$app/environment';
    import { decryptMessage, get as getAuthor } from './authors';
    import { afterNavigate, beforeNavigate } from '$app/navigation';
    import type { RealtimeChannel } from '@supabase/supabase-js';
    import MessageInput from './MessageInput.svelte';

    export let data: PageData;
    let loading = true;

    $: room = data.room;
    let messages = [];
    $: invited = room?.membership.join_state === 'invited';

    let sub: RealtimeChannel | null = null;
    let bottomContainer: HTMLDivElement | null = null;
    const scrollToBottom = (smooth?: boolean) => {
        if (bottomContainer === null) {
            console.log('no bottom container???');
            return
        }
        bottomContainer.scrollIntoView( smooth ?{
            behavior: 'smooth',
        } : false);
    }

    $: {
        loading = true
        data.room.messages.then(m => {
            messages = m
            loading = false
            requestAnimationFrame(() => scrollToBottom(true))
        })
    }

    afterNavigate(() => {
        sub = subscribeToRoomMessages(data.supabase, room.id, async (event) => {
            if (event.eventType === 'INSERT') {
                const newMessage = event.new as Message;
                const author = await getAuthor(data.supabase, newMessage.author_id);
                const newAuthoredMessage = {
                    created_at: newMessage.created_at,
                    id: newMessage.id,
                    content: newMessage.content,
                    room_id: newMessage.room_id,
                    author
                } satisfies AuthoredMessage;
                decryptMessage(data.supabase, newAuthoredMessage).then((plaintextMessage) => {
                    messages = [...messages, plaintextMessage];
                    console.log('New message received');
                    requestAnimationFrame(() => scrollToBottom(false));
                });
            }
        });
    });

    beforeNavigate(() => {
        if (sub !== null) {
            sub.unsubscribe();
        }
    });

    const onJoinRoomClick = async () => {
        console.log('Joining room');
        await joinRoom(data.supabase, room.id);
        invited = false;
    };
</script>

<svelte:head>
    <title>{room.name} | Firestorm</title>
</svelte:head>

<div class='grid h-full grid-cols-1'>
    <div class='row-start-auto overflow-y-auto text-white'>
        {#if loading}
            Loading...
        {:else }
            <MessageList {messages} />
        {/if}
        <div bind:this={bottomContainer} class='w-full h-1'></div>
    </div>
    <div class='self-end mb-4 p-2'>
        {#if invited}
            <div class='text-gray-400 flex justify-between items-center w-full px-4'>
                You have been invited to this room. Please join to send messages.
                <Button on:click={onJoinRoomClick}>Join</Button>
            </div>
        {:else}
            <MessageInput {bottomContainer} />
        {/if}
    </div>
</div>

<style>
    div.grid {
        grid-template-rows: 1fr 5rem;
    }
</style>

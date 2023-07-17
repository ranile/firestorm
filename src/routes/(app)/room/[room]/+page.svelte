<script lang="ts">
    import type { PageData } from './$types';
    import { Button } from 'flowbite-svelte';
    import { type AuthoredMessage, subscribeToRoomMessages } from '$lib/db/messages';
    import type { Message } from '$lib/db/messages';
    import { joinRoom } from '$lib/db/rooms';
    import { decryptMessage } from './authors';
    import { afterNavigate, beforeNavigate } from '$app/navigation';
    import type { RealtimeChannel } from '@supabase/supabase-js';
    import MessageInput from './MessageInput.svelte';
    import MessagesChunk from './MessagesChunk.svelte';
    import { groupMessages } from '$lib/utils/messageChunks';
    import { olmAccount, raise } from '$lib/utils.js';

    export let data: PageData;
    let loading = true;

    $: room = data.room;
    let messages: AuthoredMessage[] = [];
    $: invited = room?.membership.join_state === 'invited';

    let sub: RealtimeChannel | null = null;
    let bottomContainer: HTMLDivElement | null = null;
    const scrollToBottom = (smooth?: boolean) => {
        if (bottomContainer === null) {
            console.log('no bottom container???');
            return;
        }
        bottomContainer.scrollIntoView(
            smooth
                ? {
                      behavior: 'smooth'
                  }
                : false
        );
    };

    $: {
        loading = true;
        data.room.messages.then((m) => {
            messages = m;
            loading = false;
            requestAnimationFrame(() => scrollToBottom(true));
        });
    }

    afterNavigate(() => {
        sub = subscribeToRoomMessages(data.supabase, room.id, async (event) => {
            if (event.eventType === 'INSERT') {
                const newMessage = event.new as Message;
                const newAuthoredMessage = {
                    created_at: newMessage.created_at,
                    id: newMessage.id,
                    content: newMessage.content,
                    room_id: newMessage.room_id,
                    reply_to: newMessage.reply_to,
                    attachments: undefined,
                    author: {
                        id: newMessage.author_id,
                        username: null,
                        avatar: null
                    }
                } satisfies AuthoredMessage;
                decryptMessage(data.supabase, newAuthoredMessage).then((plaintextMessage) => {
                    messages = [...messages, plaintextMessage];
                    console.log('New message received');
                    requestAnimationFrame(() => scrollToBottom(false));
                });
            } else if (event.eventType === 'UPDATE') {
                if (event.new.deleted) {
                    messages = messages.filter((m) => m.id !== event.old.id);
                }
            } else {
                console.log('Unknown event', event);
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
        await joinRoom(data.supabase, $olmAccount ?? raise('olmAccount must not be null'), room.id);
        invited = false;
    };
</script>

<svelte:head>
    <title>{room.name} | Firestorm</title>
</svelte:head>

<div class="row-start-auto overflow-y-auto text-white">
    {#if loading}
        Loading...
    {:else}
        <div class="flex flex-col p-4 sm:p-6 gap-2">
            {#each groupMessages(messages) as chunk (chunk.firstMessageTimestamp)}
                <MessagesChunk {chunk} />
            {/each}
        </div>
    {/if}
    <div bind:this={bottomContainer} class="w-full h-1" />
</div>
<div class="self-end mb-4 p-2">
    {#if invited}
        <div class="text-gray-400 flex justify-between items-center w-full px-4">
            You have been invited to this room. Please join to send messages.
            <Button on:click={onJoinRoomClick}>Join</Button>
        </div>
    {:else}
        <MessageInput {bottomContainer} />
    {/if}
</div>

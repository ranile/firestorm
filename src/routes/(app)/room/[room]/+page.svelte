<script lang="ts">
    import type { PageData } from './$types';
    import { Button, Textarea, ToolbarButton } from 'flowbite-svelte';
    import { createMessage } from '$lib/db/messages';
    import MessageList from './MessageList.svelte';
    import type { Message } from '$lib/db/messages';
    import { onMount } from 'svelte';
    import { joinRoom } from '$lib/db/rooms';
    import { OutboundSession } from 'moe';
    import { browser } from '$app/environment';

    export let data: PageData;
    let value = '';
    let messages: Message[] = data.messages;
    $: room = data.room;
    let invited = room?.membership.join_state === 'invited';

    let outbound: OutboundSession | undefined;

    onMount(() => {
        const channel = new BroadcastChannel('sw-messages');
        channel.addEventListener?.('message', (event) => {
            const payload = event.data;
            if (payload.eventType === 'INSERT') {
                console.info('received new message event', payload);
                const newMessage = payload.new as Message;
                // todo decrypt new message's ciphertext
                messages = [...messages, newMessage];
            }
        });

        return () => channel.close();
    });

    $: if (browser) {
        const PICKLE_KEY = new Uint8Array(32).map(() => 1);

        const pickle = localStorage.getItem(`${room.id}:pickle`);
        outbound = pickle ? OutboundSession.from_pickle(pickle, PICKLE_KEY) : undefined;
    }

    const sendMessage = (e: Event) => {
        e.preventDefault();
        if (outbound === undefined) {
            throw Error('Outbound session not initialized');
        }
        const roomId = room.id;
        const content = outbound.encrypt(value);
        const uid = data.session?.user.id;
        if (uid === undefined) {
            throw Error('User not logged in');
        }
        createMessage(data.supabase, roomId, uid!, content).then(() => (value = ''));
    };
    const onJoinRoomClick = async () => {
        console.log('Joining room');
        await joinRoom(data.supabase, room.id);
        invited = false;
    };
</script>

<div class="grid h-full grid-cols-1">
    <div class="row-start-auto overflow-y-auto text-white">
        <MessageList {messages} />
    </div>
    <div class="self-end mb-4 p-2 flex gap-2">
        {#if invited}
            <div class="text-gray-400 flex justify-between items-center w-full px-4">
                You have been invited to this room. Please join to send messages.
                <Button on:click={onJoinRoomClick}>Join</Button>
            </div>
        {:else}
            <Textarea bind:value class="" rows="1" placeholder="Your message..." />
            <ToolbarButton
                on:click={sendMessage}
                type="submit"
                color="blue"
                class="rounded-full text-blue-600 dark:text-blue-500"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                </svg>
                <span class="sr-only">Send message</span>
            </ToolbarButton>
        {/if}
    </div>
</div>

<style>
    div.grid {
        grid-template-rows: 1fr 5rem;
    }
</style>

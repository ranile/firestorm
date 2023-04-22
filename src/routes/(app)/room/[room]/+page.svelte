<script lang='ts'>
    import type { PageData } from './$types';
    import { Textarea, ToolbarButton } from 'flowbite-svelte';
    import { createMessage, subscribeToRoomMessages } from '$lib/db/messages';
    import MessageList from './MessageList.svelte';
    import type { Messages } from '$lib/db/messages';
    import { onMount } from 'svelte';
    import { getMessages } from '../../../../lib/db/messages';
    import { OutboundSession } from 'moe';

    export let data: PageData;
    let value = '';
    let messages: Messages = [];
    $: {
        getMessages(data.supabase, data.room.id).then((m) => {
            messages = m;
        });
    }

    let outbound: OutboundSession | undefined

    onMount(() => {
        subscribeToRoomMessages(data.supabase, data.room.id, (payload) => {
            if (payload.eventType === 'INSERT') {
                messages = [...messages, payload.new]
            }
        })

        const PICKLE_KEY = new Uint8Array(32).map(() => 1);

        const pickle = localStorage.getItem(`${data.room.id}:pickle`);
        outbound = pickle ? OutboundSession.from_pickle(pickle, PICKLE_KEY) : undefined;
    })

    const sendMessage = (e: Event) => {
        e.preventDefault()
        const roomId = data.room.id;
        const content = outbound ? outbound.encrypt(value) : value;
        const uid = data.session.user.id
        createMessage(data.supabase, roomId, uid, content).then(() => value = '')
    };
</script>

<div class='grid h-full grid-cols-1'>
    <h1 class='text-2xl font-bold '>{data.room.name}</h1>
    <div class='row-start-auto overflow-y-auto'>
        <MessageList {messages} roomId={data.room.id} />
    </div>
    <div class='self-end mb-4 p-2 flex gap-2'>
        <Textarea bind:value class='' rows='1' placeholder='Your message...' />
        <ToolbarButton on:click={sendMessage} type='submit' color='blue' class='rounded-full text-blue-600 dark:text-blue-500'>
            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5'
                 stroke='currentColor'
                 class='w-6 h-6'>
                <path stroke-linecap='round' stroke-linejoin='round'
                      d='M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5' />
            </svg>
            <span class='sr-only'>Send message</span>
        </ToolbarButton>
    </div>
</div>

<style>
    div.grid {
        grid-template-rows: 3rem 1fr 5rem;
    }
</style>
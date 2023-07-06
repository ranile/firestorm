<script lang="ts">
    import type { ChunkMessage, GroupedMessage } from '$lib/utils/messageChunks';
    import AttachmentPreview from '$lib/components/attachments/AttachmentPreview.svelte';
    import { formatTimestamp } from '$lib/utils/timestamps';
    import { deleteMessage as doDeleteMessage, updateMessage } from '$lib/db/messages';
    import { supabase } from '$lib/supabase';
    import Trash from 'svelte-material-icons/Delete.svelte';
    import Edit from 'svelte-material-icons/Pencil.svelte';
    import Reply from 'svelte-material-icons/Reply.svelte';
    import MessageReply from './MessageReply.svelte';
    import { replyingToMessage } from './utils';
    import { Textarea } from 'flowbite-svelte';
    import { getOutboundSession } from './authors';

    export let chunk: GroupedMessage;
    $: author = chunk.author;

    const deleteMessage = (id: string) => {
        console.log('delete message', id);
        doDeleteMessage($supabase!, id);
    };

    let editing = false;

    const onKeyDown = (e: KeyboardEvent, message: ChunkMessage) => {
        if (e.key === 'Enter') {
            // todo: this is horrible; fix this
            let outbound = getOutboundSession(window.location.pathname.split('/').at(-1)!);
            if (!outbound) {
                throw new Error('no outbound session');
            }
            updateMessage($supabase!, message.id, {
                content: outbound.encrypt(message.content)
            }).then(() => {
                editing = false;
            });
        }
    };
</script>

<div class="relative">
    <div class="static pl-12">
        <img src={author?.avatar} class="rounded-full w-10 h-10 absolute -left-4 z-10" alt=" " />

        <h3>
            <span>{author?.username}</span>
            <span class="text-xs">{formatTimestamp(chunk.firstMessageTimestamp)}</span>
        </h3>
        <div class="messages">
            {#each chunk.messages as message}
                {#if message.replyTo}
                    <MessageReply replyMessageId={message.replyTo} />
                {/if}
                <div
                    class="relative hover:bg-gray-600 group transition-colors"
                    data-message-id={message.id}
                >
                    <div
                        class="absolute right-1 -top-2 px-2 bg-gray-800 rounded invisible group-hover:visible"
                    >
                        <button
                            class="hover:bg-gray-600 rounded p-1"
                            on:click={() => deleteMessage(message.id)}
                        >
                            <Trash size="1.5em" />
                            <span class="sr-only">Delete Message</span>
                        </button>
                        <button
                            class="hover:bg-gray-600 rounded p-1"
                            on:click={() => (editing = true)}
                        >
                            <Edit size="1.5em" />
                            <span class="sr-only">Edit Message</span>
                        </button>
                        <button
                            class="hover:bg-gray-600 rounded p-1"
                            on:click={() => replyingToMessage.set(message)}
                        >
                            <Reply size="1.5em" />
                            <span class="sr-only">Reply to message</span>
                        </button>
                    </div>
                    <div>
                        {#if editing}
                            <Textarea
                                class="w-full"
                                placeholder="Edit message..."
                                bind:value={message.content}
                                on:keydown={(e) => onKeyDown(e, message)}
                            />
                        {:else}
                            <p>{message.content}</p>
                        {/if}
                    </div>
                    {#if message.attachments}
                        {#each message.attachments as attachment}
                            <AttachmentPreview {attachment} />
                        {/each}
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</div>

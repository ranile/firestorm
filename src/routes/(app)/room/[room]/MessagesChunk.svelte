<script lang="ts">
    import type { GroupedMessage } from '$lib/utils/messageChunks';
    import AttachmentPreview from '$lib/components/attachments/AttachmentPreview.svelte';
    import { formatTimestamp } from '$lib/utils/timestamps';
    import { deleteMessage as doDeleteMessage } from '$lib/db/messages';
    import { supabase } from '$lib/supabase';
    import Trash from 'svelte-material-icons/Delete.svelte';
    import Edit from 'svelte-material-icons/Pencil.svelte';
    import Reply from 'svelte-material-icons/Reply.svelte';
    import MessageReply from './MessageReply.svelte';
    import { replyingToMessage } from './utils';

    export let chunk: GroupedMessage;
    $: author = chunk.author;

    const deleteMessage = (id: string) => {
        console.log('delete message', id);
        doDeleteMessage($supabase!, id);
    };

    $: console.log(chunk);
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
                        </button>
                        <button class="hover:bg-gray-600 rounded p-1">
                            <Edit size="1.5em" />
                        </button>
                        <button
                            class="hover:bg-gray-600 rounded p-1"
                            on:click={() => replyingToMessage.set(message)}
                        >
                            <Reply size="1.5em" />
                        </button>
                    </div>
                    <div>
                        <p>{message.content}</p>
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

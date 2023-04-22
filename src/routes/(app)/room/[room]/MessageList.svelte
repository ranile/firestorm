<script lang='ts'>

    import type { Message } from '$lib/db/messages';
    import { groupMessages } from '$lib/utils/messageChunks';
    import MessagesChunk from './MessagesChunk.svelte';

    export let roomId: string;
    export let messages: Message[] = [];
    $: grouped = groupMessages(messages);

</script>
<div class='flex flex-col p-4 sm:p-6 gap-2'>
    {#each grouped as chunk (chunk.firstMessage)}
        <MessagesChunk {roomId} {chunk} />
    {/each}
</div>
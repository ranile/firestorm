<script lang="ts">
    import type { AuthoredMessage, Message } from '$lib/db/messages';
    import { groupMessages } from '$lib/utils/messageChunks';
    import MessagesChunk from './MessagesChunk.svelte';

    export let messages: AuthoredMessage[] = [];
    $: grouped = groupMessages(messages);
</script>

<div class="flex flex-col p-4 sm:p-6 gap-2">
    {#each grouped as chunk (chunk.firstMessageTimestamp)}
        <MessagesChunk {chunk} />
    {/each}
</div>

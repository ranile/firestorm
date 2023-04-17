<script lang='ts'>

    import type { Message } from '$lib/db/messages';
    import { groupMessages } from '$lib/utils/messageChunks';

    export let messages: Message[] = [];
    $: grouped = groupMessages(messages).map(chunk => ({ ...chunk, firstMessage: chunk.messages[0].created_at }));
</script>
<div class='flex flex-col p-4 sm:p-6 gap-2'>
    {#each grouped as chunk (chunk.firstMessage)}
        <p>{chunk.author_id}</p>
        {#each chunk.messages as message (message.id)}
            <p>{message.content}</p>
        {/each}
    {/each}
</div>
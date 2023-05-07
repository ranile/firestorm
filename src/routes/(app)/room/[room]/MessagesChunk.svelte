<script lang="ts">
    import type { GroupedMessage } from '$lib/utils/messageChunks';
    import { formatTimestamp } from '$lib/utils/timestamps';

    export let chunk: GroupedMessage;
    $: author = chunk.author;
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
                <div class="">
                    <p>{message.content}</p>
                </div>
            {/each}
        </div>
    </div>
</div>

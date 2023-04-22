<script lang='ts'>
    import { supabase } from '$lib/supabase';
    import { get as getAuthor, getInboundSession } from './authors';
    import type { GroupedMessage } from '$lib/utils/messageChunks';
    import type { Profile } from '$lib/db/users';
    import { onMount } from 'svelte';


    export let roomId: string;
    export let chunk: GroupedMessage;
    const timestamp = new Date(chunk.messages[0].created_at);
    let author: Profile;
    onMount(() => {
        getAuthor(supabase, chunk.authorId).then((a) => {
            author = a;
        });

    });
    const decrypt = async (content: string) => {
        const sess = await getInboundSession(supabase, chunk.authorId, roomId)
        return sess.decrypt(content)
    };
</script>

<div class='relative'>
    <div class='static pl-12'>
        <img src={author?.avatar} class='rounded-full w-10 h-10 absolute -left-4 z-10' alt=' ' />

        <h3>
            <span>{author?.username}</span>
            <span class='text-sm'>{'timestamp'}</span>

        </h3>
        <div class='messages'>
            {#each chunk.messages as message}
                <div class=''>
                    {#await decrypt(message.content) then content}
                        <p>{content}</p>
                    {/await}
                </div>
            {/each}
        </div>

    </div>
</div>


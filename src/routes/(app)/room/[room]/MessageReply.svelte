<script lang='ts'>
    import { getMessages } from '$lib/db/messages';
    import { supabase } from '$lib/supabase';
    import { decryptMessage } from './authors';
    import Close from 'svelte-material-icons/Close.svelte'
    import { replyingToMessage } from './utils';

    export let replyMessageId: string;
    export let showDismissReply = false;

    $: promise = getMessages($supabase!, undefined, 1, replyMessageId).then((messages) => {
        const message = messages[0];
        return decryptMessage($supabase!, message);
    });
    const navToOriginal = () => {
        const original = document.querySelector(`[data-message-id='${replyMessageId}']`);
        original?.scrollIntoView({ behavior: 'smooth' });
        original?.classList.add('bg-gray-600');
        setTimeout(() => {
            original?.classList.remove('bg-gray-600');
        }, 1000);
    };
</script>

{#await promise}
    <p>Loading...</p>
{:then message}
    <div class='flex justify-between'>
        <blockquote class='text-sm flex gap-2 ml-2 cursor-pointer brightness-80 hover:brightness-100'
                    on:click={navToOriginal}>
            <span class='font-bold'>{message.author.username}</span>
            <p>{message.content.slice(0, 69)}</p>
        </blockquote>
        {#if showDismissReply}
            <button on:click={() => replyingToMessage.set(null)}>
                <Close size='1.2em' />
            </button>
        {/if}
    </div>
{:catch error}
    <p>{error.message}</p>
{/await}
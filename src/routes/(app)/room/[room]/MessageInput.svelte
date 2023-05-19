<script lang='ts'>
    import { Textarea } from 'flowbite-svelte';
    import { OutboundSession } from 'moe';
    import { browser } from '$app/environment';
    import { createMessage } from '$lib/db/messages';
    import { page } from '$app/stores';
    import AttachmentIcon from 'svelte-material-icons/Attachment.svelte';
    import SendIcon from 'svelte-material-icons/Send.svelte';
    import IconButton from '$lib/components/IconButton.svelte';

    $: data = $page.data;

    export let bottomContainer: HTMLDivElement;

    let inputEl: HTMLInputElement;
    let value = '';
    let files: FileList | undefined = undefined;

    let outbound: OutboundSession | undefined;
    $: if (browser) {
        const PICKLE_KEY = new Uint8Array(32).map(() => 1);

        const pickle = localStorage.getItem(`${data.room.id}:pickle`);
        outbound = pickle ? OutboundSession.from_pickle(pickle, PICKLE_KEY) : undefined;
    }

    const sendMessage = (e: Event) => {
        e.preventDefault();
        if (value === '') {
            // no empty messages
            return;
        }
        if (outbound === undefined) {
            throw Error('Outbound session not initialized');
        }
        const roomId = data.room.id;
        const content = outbound.encrypt(value);
        const uid = data.session?.user.id;
        if (uid === undefined) {
            throw Error('User not logged in');
        }
        createMessage(data.supabase, roomId, uid!, content).then(() => {
            value = '';
            bottomContainer.scrollIntoView(false);
        });
    };
    const addFile = () => {
        inputEl.click();
    };

</script>
<input bind:files type='file' class='hidden' bind:this={inputEl} />

<div class='flex mx-2 flex-col gap-2'>
    {#if files !== undefined && files?.length !== 0}
        <div class='flex flex-col gap-2 bg-pink-600 z-20 mx-14 px-2'>
            {#each Array.from(files) as file}
                <div class='flex gap-2'>
                    <span>{file.name}</span>
                    <span>{file.size}</span>
                </div>
            {/each}
        </div>
    {/if}
    <div class='flex gap-3'>
        <IconButton icon={AttachmentIcon} on:click={addFile} />
        <Textarea bind:value class='' rows='1' placeholder='Your message...' />
        <IconButton
            on:click={sendMessage}
            icon={SendIcon}
        >
        </IconButton>
    </div>
</div>

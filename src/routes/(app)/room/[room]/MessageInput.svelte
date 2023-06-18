<script lang="ts">
    import { Textarea } from 'flowbite-svelte';
    import type { OutboundSession } from 'moe';
    import { browser } from '$app/environment';
    import { createMessage } from '$lib/db/messages';
    import { page } from '$app/stores';
    import AttachmentIcon from 'svelte-material-icons/Attachment.svelte';
    import SendIcon from 'svelte-material-icons/Send.svelte';
    import IconButton from '$lib/components/IconButton.svelte';
    import { initAttachmentsWorker } from '$lib/attachments';
    import { replyingToMessage } from './utils';
    import MessageReply from './MessageReply.svelte';
    import { getOutboundSession } from './authors';

    $: data = $page.data;

    export let bottomContainer: HTMLDivElement;

    let inputEl: HTMLInputElement;
    let value = '';
    let files: FileList | undefined = undefined;

    let outbound: OutboundSession | undefined;
    $: if (browser) {
        outbound = getOutboundSession(data.room.id);
    }

    $: worker = initAttachmentsWorker((m) => {
        const { room_id: roomId, uid, ciphertext, files: encryptedFiles } = m;
        createMessage(
            data.supabase,
            outbound!,
            roomId,
            uid!,
            ciphertext,
            $replyingToMessage?.id ?? null,
            encryptedFiles
        ).then(() => {
            value = '';
            files = undefined;
            replyingToMessage.set(null);
            bottomContainer.scrollIntoView(false);
        });
    });

    const sendMessage = (e: Event) => {
        e.preventDefault();
        if (value === '' && files?.length === 0) {
            // no empty messages
            return;
        }
        if (outbound === undefined) {
            alert(
                'No keys for this room found. Please import the keys from another device to send messages here'
            );
            return;
        }
        const uid = data.session?.user.id;
        if (uid === undefined) {
            throw Error('User not logged in');
        }
        const roomId = data.room.id;
        console.log(files);
        worker.newMessage(
            outbound,
            roomId,
            uid,
            value,
            // @ts-expect-error Vec<File> is not assignable to FileList
            files ?? []
        );
    };
    const addFile = () => {
        inputEl.click();
    };
</script>

<input bind:files type="file" class="hidden" bind:this={inputEl} />

<div class="flex mx-2 flex-col">
    {#if files !== undefined && files?.length !== 0}
        <div class="flex flex-col gap-2 bg-pink-600 z-20 mx-14 px-2">
            {#each Array.from(files) as file}
                <div class="flex gap-2">
                    <span>{file.name}</span>
                    <span>{file.size}</span>
                </div>
            {/each}
        </div>
    {/if}
    {#if $replyingToMessage !== null}
        <div class="bg-gray-900 mx-14 px-2 py-1 rounded-t-xl">
            <MessageReply replyMessageId={$replyingToMessage.id} showDismissReply={true} />
        </div>
    {/if}
    <div class="flex gap-3">
        <IconButton icon={AttachmentIcon} on:click={addFile} label="Add files" />
        <Textarea bind:value class="" rows="1" placeholder="Your message..." />
        <IconButton on:click={sendMessage} icon={SendIcon} label="Send message" />
    </div>
</div>

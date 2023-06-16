<script lang="ts">
    import type { Attachment } from '$lib/db/messages';
    import { supabase } from '$lib/supabase';
    import { initDecryptAttachmentsWorker } from '$lib/attachments';
    import { onDestroy } from 'svelte';
    import ImagePlaceholder from 'svelte-material-icons/Image.svelte';
    import DownloadIcon from 'svelte-material-icons/Download.svelte';

    export let attachment: Attachment;
    $: isImage = attachment.type?.startsWith('image') ?? false;

    let src: string | null = null;

    $: worker = initDecryptAttachmentsWorker((workerOutput: Uint8Array) => {
        src = URL.createObjectURL(new Blob([workerOutput.buffer], { type: attachment.type! }));
        if (!isImage) {
            const a = document.createElement('a');
            a.href = src;
            a.download = attachment.name!;
            a.click();
        }
    });

    onDestroy(() => {
        if (src !== null) {
            URL.revokeObjectURL(src);
        }
    });

    const download = (attachment: Attachment) => {
        $supabase!.storage
            .from('attachments')
            .download(attachment.path!)
            .then(({ data: blob }) => {
                if (blob === null) {
                    throw Error('blob is null');
                }
                worker.decryptAttachment(blob, attachment.key);
            });
    };

    $: if (isImage) {
        download(attachment);
    }
</script>

{#if isImage}
    {#if src === null}
        <div
            class="my-2 animate-pulse flex justify-center items-center w-full h-48 bg-gray-300 shadow rounded-md sm:w-96 dark:bg-gray-700"
        >
            <ImagePlaceholder size={48} />
        </div>
    {:else}
        <img {src} alt=" " class="max-w-xs" />
    {/if}
{:else}
    <div class='flex bg-gray-900 w-fit py-1 px-2 rounded-3xl items-center'>
        <h5 class='font-bold text-md'>{attachment.name}</h5>
        <button
            class='m-2 rounded-full p-1 border border-gray-100'
            on:click={() => download(attachment)}>
            <DownloadIcon size='1.1em' />
        </button>
    </div>
{/if}

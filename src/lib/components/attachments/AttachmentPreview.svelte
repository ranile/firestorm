<script lang="ts">
    import type { AuthoredMessage } from '$lib/db/messages';
    import { supabase } from '$lib/supabase';
    import { initDecryptAttachmentsWorker } from '$lib/attachments';

    export let attachment: AuthoredMessage['attachments'][number];

    let workerOutput: Uint8Array | null = null;
    let img: HTMLImageElement | null = null;

    // TODO: optimization: use a single worker for all attachments instead of creating one for each one
    const worker = initDecryptAttachmentsWorker((o) => {
        workerOutput = o;
        console.log(workerOutput);
        if (img) {
            img.src = URL.createObjectURL(
                new Blob([workerOutput.buffer], { type: attachment.type! } /* (1) */)
            );
        }
    });

    const file = $supabase!.storage.from('attachments').download(attachment.path!);
    file.then(({ data: blob }) => {
        if (blob === null) {
            throw Error('blob is null');
        }
        worker.decryptAttachment(blob, attachment.key);
    });
</script>

<img bind:this={img} alt=" " />

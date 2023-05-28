<script lang="ts">
    import type { AuthoredMessage } from '$lib/db/messages';
    import { supabase } from '$lib/supabase';
    import { newDecryptAttachmentsWorker } from 'moe';

    export let attachment: AuthoredMessage['attachments'][number];

    let workerOutput: Uint8Array | null = null;
    let src = '';

    // TODO: optimization: use a single worker for all attachments instead of creating one for each one
    $: worker = newDecryptAttachmentsWorker((o: Uint8Array) => {
        workerOutput = o;
        const url = URL.createObjectURL(
            new Blob([workerOutput.buffer], { type: attachment.type! })
        );
        console.log('XXX', url, attachment);
        src = url;
    });

    const file = $supabase!.storage.from('attachments').download(attachment.path!);
    file.then(({ data: blob }) => {
        if (blob === null) {
            throw Error('blob is null');
        }
        worker.decryptAttachment(blob, attachment.key);
    });
</script>

<img {src} alt=" " class="max-w-xs" />

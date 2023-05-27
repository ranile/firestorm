<script lang="ts">
    import type { AuthoredMessage } from '$lib/db/messages';
    import { supabase } from '$lib/supabase';
    import { initDecryptAttachmentsWorker } from '$lib/attachments';
    import { browser } from '$app/environment';

    export let attachment: AuthoredMessage['attachments'][number];

    let workerOutput: Uint8Array | null = null;
    let img;

    const worker = initDecryptAttachmentsWorker((o) => {
        workerOutput = o;
        console.log(workerOutput);
        if (img) {
            img.src = URL.createObjectURL(
                new Blob([workerOutput.buffer], { type: attachment.type } /* (1) */)
            );
        }

    })

    console.log(attachment.path);
    const file = $supabase.storage.from('attachments').download(attachment.path)
    console.log(file);
    file.then(({ data: blob }) => {
        console.log('c??', blob);
        worker.decryptAttachment(blob, attachment.key)
    })
</script>
<img bind:this={img} />
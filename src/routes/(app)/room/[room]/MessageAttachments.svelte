<script lang="ts">
    import { type Attachment, getAttachmentsForMessage } from '$lib/db/messages';
    import AttachmentPreview from '$lib/components/attachments/AttachmentPreview.svelte';
    import { page } from '$app/stores';

    export let messageId: string
    export let attachments: Attachment[] | undefined = undefined;
</script>

{#if attachments === undefined}
    {#await getAttachmentsForMessage($page.data.supabase, messageId) then attachments}
        {#each attachments as attachment (attachment.attachment_id)}
            <AttachmentPreview {attachment} />
        {/each}
    {/await}
{:else if attachments.length > 0}
    {#each attachments as attachment (attachment.attachment_id)}
        <AttachmentPreview {attachment} />
    {/each}
{/if}

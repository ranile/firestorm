<script lang="ts">
    import { formatTimestamp } from '$lib/utils/timestamps';
    export let username: string | null;

    $: if (username === null) {
        throw new Error('username is required');
    }
    export let avatar: string | null;
    export let firstMessageTimestamp: string;
</script>

<img src={avatar} class="rounded-full w-10 h-10 absolute -left-4 z-10" alt=" " />

<h3>
    <span>{username}</span>
    <span class="text-xs">{formatTimestamp(firstMessageTimestamp)}</span>
</h3>

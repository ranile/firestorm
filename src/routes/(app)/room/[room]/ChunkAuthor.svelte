<script lang="ts">
    import { formatTimestamp } from '$lib/utils/timestamps';
    export let username;
    export let avatar;
    export let firstMessageTimestamp;
</script>

<img src={avatar} class='rounded-full w-10 h-10 absolute -left-4 z-10' alt=' ' />

<h3>
    <span>{username}</span>
    <span class='text-xs'>{formatTimestamp(firstMessageTimestamp)}</span>
</h3>
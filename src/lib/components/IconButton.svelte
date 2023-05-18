<script lang="ts">
    import type { SvelteComponent } from 'svelte';

    export let icon: SvelteComponent | undefined = undefined;
</script>

<button
    class='focus:ring-4 focus:outline-none inline-flex items-center justify-center p-2 border border-blue-500 text-blue-500 hover:text-white hover:bg-blue-600 focus:ring-blue-800 rounded-full'
    on:click
>
    <slot>
        {#if icon !== undefined}
            <svelte:component this={icon} size='1.5em' />
        {/if}
    </slot>
</button>
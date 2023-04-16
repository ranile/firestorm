<script lang="ts">
    import type { PageData } from './$types';

    export let data: PageData;

    let loadedData = [];
    async function loadData() {
        const { data: result } = await data.supabase.from('rooms').select('*').limit(20);
        loadedData = result;
    }

    $: if (data.session) {
        loadData();
    }

    const signout = () => {
        data.supabase.auth.signOut()
    }
</script>


<h1 class="text-3xl font-bold underline">
    Hello Svelte!
</h1>


{#if data.session}
    <p>client-side data fetching with RLS</p>
    <pre>{JSON.stringify(loadedData, null, 2)}</pre>
    <button on:click={signout}>sign out</button>
{/if}

<style lang="postcss">
    :global(html) {
        background-color: theme(colors.gray.100);
    }
</style>
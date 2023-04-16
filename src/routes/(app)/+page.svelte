<script lang="ts">
    import type {PageData} from './$types';

    export let data: PageData;

    const signout = () => {
        data.supabase.auth.signOut()
    }
</script>


<button on:click={signout}>sign out</button>

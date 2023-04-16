<script lang="ts">
    import type { PageData } from './$types';
    import {goto} from '$app/navigation';
    import { browser } from '$app/environment';
    import { Auth } from '@supabase/auth-ui-svelte'
    import { ThemeSupa } from '@supabase/auth-ui-shared'
    import {onMount} from "svelte";

    export let data: PageData;
    // elina@pastify.xyz
</script>

<div class="w-2/6 m-auto">
    <Auth supabaseClient={data.supabase} appearance={{ theme: ThemeSupa }} />
</div>

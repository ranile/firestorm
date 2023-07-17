<script lang="ts">

    import { page } from '$app/stores';
    import { olmAccount } from '$lib/utils';

    const click =async () => {
        const oneTimeKeys = $olmAccount!.generateOneTimeKeys(100);
        const rows = [];
        for (const [id, key] of oneTimeKeys) {
            rows.push({ id: $page.data.session.user.id, key_id: id, curve25519: key });
        }

        const otk = await $page.data.supabase.from('user_one_time_keys').insert(rows);
        $olmAccount!.markKeysAsPublished();
        const arr = new Uint8Array(32);
        crypto.getRandomValues(arr);
        const pickle = $olmAccount.to_pickle(arr);

        localStorage.setItem(
            'account:pickle',
            JSON.stringify({
                pickle,
                key: [...arr]
            })
        );
    }


</script>
<button on:click={click}>add one time keys</button>
<script lang="ts">
    import { page } from '$app/stores';
    import { olmAccount, raise } from '$lib/utils';
    import { trpc } from '$lib/trpc/client.ts';

    const click = async () => {
        const oneTimeKeys = $olmAccount!.generateOneTimeKeys(100);
        const rows = [];
        for (const [id, key] of oneTimeKeys) {
            rows.push({ id: $page.data.session!.user.id, key_id: id, curve25519: key });
        }

        const otk = await $page.data.supabase.from('user_one_time_keys').insert(rows);
        $olmAccount!.markKeysAsPublished();
        const arr = new Uint8Array(32);
        crypto.getRandomValues(arr);
        const pickle = $olmAccount?.to_pickle(arr) ?? raise('olmAccount must not be null');

        localStorage.setItem(
            'account:pickle',
            JSON.stringify({
                pickle,
                key: [...arr]
            })
        );
    };

    const trpcTest = async () => {
        console.log($page);
        const t = trpc($page);
        console.log(await t.messages.query());
    }
</script>

<!--<button on:click={click}>add one time keys</button>-->
<button on:click={trpcTest}>test</button>

<script lang="ts">
    import { Button } from 'flowbite-svelte';
    let uploadInputEl: HTMLInputElement | null = null;
    const exportKeys = async () => {
        const keys: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.endsWith('pickle')) {
                keys[key] = localStorage[key];
            }
        }
        const uri = `data:application/json;charset=UTF-8,${encodeURIComponent(
            JSON.stringify(keys)
        )}`;
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute('href', uri);
        dlAnchorElem.setAttribute('download', 'keys.json');
        dlAnchorElem.click();
    };

    const importKeys = async () => {
        const file = uploadInputEl?.files?.item(0);
        if (!file) return;
        const json = await file.text();
        const data = JSON.parse(json);
        for (const key in data) {
            localStorage.setItem(key, data[key]);
        }
        location.reload();
    };
</script>

<input type="file" id="file" class="hidden" bind:this={uploadInputEl} on:change={importKeys} />
<h3 class="text-xl p-2 font-bold">Cryptography</h3>

<div class="p-2 flex gap-4">
    <Button on:click={exportKeys}>Export room E2E keys</Button>
    <Button on:click={() => uploadInputEl?.click()}>Import room E2E keys</Button>
</div>

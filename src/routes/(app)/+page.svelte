<script>
    import { worker_init } from 'moe';

    let message;
    let bridge = worker_init((m) => {
        console.log('resule', m);
        message = m
    })

    console.log('bridge', bridge);

    let files;
    const click = () => bridge.send_file(files.item(0))
</script>


<input bind:files type='file' />
<button on:click={click}>click</button>

<br>
<p>{message?.bytes.length}</p>
<p>{message?.name}</p>
<p>{message?.type}</p>
<p>{JSON.stringify(message?.key)}</p>

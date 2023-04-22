<script>
    import { initRoomEncryption } from '$lib/db/rooms';
    import { browser } from '$app/environment';
    import { OutboundSession } from 'moe';

    if (browser) {
        let { pickle, sessionKey } = initRoomEncryption();
        console.log({ pickle, sessionKey });
        const secret = new Uint8Array(32).map(() => 1);
        const newSess = OutboundSession.from_pickle(pickle, secret);
        console.log(newSess.encrypt('your mum'));

    }
</script>


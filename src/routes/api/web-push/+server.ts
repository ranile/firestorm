import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { type Notification, Payload, SubscriptionInfo } from './types';
import { sendNotification } from 'web-push'
import { VAPID_PRIVATE_KEY } from '$env/static/private'
import { env } from '$env/dynamic/private'
import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public'

const { WEB_PUSH_SECRET } = env;
function jsonOr400(request: Request): Promise<unknown> {
    try {
        return request.json();
    } catch (e: unknown) {
        const err = e as Error;
        throw error(400, 'invalid request body: ' + err.message);
    }
}

function callWebPush(sub: SubscriptionInfo, message: Notification) {
    return sendNotification(sub, JSON.stringify(message), {
        contentEncoding: 'aes128gcm',
        vapidDetails: {
            subject: 'mailto:no-reply@firestorm.chat',
            publicKey: PUBLIC_VAPID_PUBLIC_KEY,
            privateKey: VAPID_PRIVATE_KEY
        }
    });
}

async function deliverNotification(data: Payload) {
    const promises = data.subscribers.map(sub => callWebPush(sub, {
        op: 'MessageCreate',
        content: data.message,
    }))
    try {
        await Promise.all(promises);
        return
    } catch (e) {
        console.error(e);
        throw error(500, 'failed to send notification');
    }
}

export const POST = (async (event) => {
    const authorization = event.request.headers.get('Authorization')
    if (authorization !== WEB_PUSH_SECRET) {
        throw error(401);
    }
    const payload = await jsonOr400(event.request);
    const parsed = await Payload.safeParseAsync(payload)
    if (!parsed.success) {
        console.error('error parsing payload', parsed.error.message);
        throw error(400, JSON.stringify(parsed.error.issues));
    }

    switch (parsed.data.channel) {
        case 'message':
            await deliverNotification(parsed.data);
            return json({ success: true });
        default:
            throw error(400, 'invalid channel');
    }
}) satisfies RequestHandler;

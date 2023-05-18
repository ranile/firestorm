// pub key generated using openssl with the following command
// openssl ec -in private.pem -pubout -outform DER|tail -c 65|base64|tr '/+' '_-'|tr -d '\n'
import { env } from '$env/dynamic/public'
import { browser } from '$app/environment';
import type { Session } from '@supabase/supabase-js';
import type { Supabase } from '$lib/supabase';

const { PUBLIC_VAPID_PUBLIC_KEY:  VAPID_PUBLIC_KEY } = env
const WEB_PUSH_SUBSCRIPTION_ID_KEY = 'webPushSubscriptionId';


function urlB64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const unsubHandler = async () => {
    console.log('unsub');
    const registration = await navigator.serviceWorker?.getRegistration();
    const sub = await registration?.pushManager?.getSubscription();
    if (sub) {
        await sub.unsubscribe();
    }
}

export async function subscribeToNotifications(supabase: Supabase, session: Session) {
    if (!browser) {
        // there is nothing to do on the server
        return
    }
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration === undefined) {
        console.error('No service worker registered');
        return;
    }
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    const subId = localStorage.getItem(WEB_PUSH_SUBSCRIPTION_ID_KEY);

    const subInfo = subscription.toJSON();
    const { data, error }  = await supabase.from('web_push_subscriptions')
        .upsert({
            id: subId ?? undefined,
            user_id: session.user.id,
            endpoint: subInfo.endpoint!,
            keys_p256dh: subInfo.keys!.p256dh,
            keys_auth: subInfo.keys!.auth
        })
        .select()
        .single();

    if (error) {
        console.error(error);
        throw error;
    }

    localStorage.setItem(WEB_PUSH_SUBSCRIPTION_ID_KEY, data.id);

    return data
}
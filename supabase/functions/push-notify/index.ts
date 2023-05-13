// noinspection ExceptionCaughtLocallyJS

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';

const SubscriptionInfo = z.object({
    endpoint: z.string(),
    keys: z.object({
        p256dh: z.string(),
        auth: z.string()
    })
});

type SubscriptionInfo = z.infer<typeof SubscriptionInfo>;

const parseAuthHeader = (authHeader: string) => {
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer') {
        throw new Error('Invalid auth header');
    }
    return token;
}

serve(async (req) => {
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    let user;
    try {
        const authHeader = parseAuthHeader(req.headers.get('Authorization')!);
        const { data, error } = await supabaseClient.auth.getUser(authHeader)
        if (error) {
            throw error
        }
        user = data.user
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 401,
        })
    }

    const subInfo = SubscriptionInfo.parse(await req.json());

    const { data, error }  = await supabaseClient.from('web_push_subscriptions').insert({
        user_id: user.id,
        endpoint: subInfo.endpoint,
        keys_p256dh: subInfo.keys.p256dh,
        keys_auth: subInfo.keys.auth
    })  .select();

    if (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: "Failed to subscribe to notifications" }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        })
    }
    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
        status: 201,
    })
});

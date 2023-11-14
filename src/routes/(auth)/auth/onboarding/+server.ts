import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { raise } from '$lib/utils';
import sql from '$lib/server/db';
import { z } from 'zod';

const UserKeys = z.object({
    deviceId: z.string(),
    identityKeys: z.object({
        ed25519: z.string(),
        curve25519: z.string()
    }),
    username: z.string(),
    oneTimeKeys: z.array(z.string())
});

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = (await getSession()) ?? raise('unauthenticated');
    const userId = session?.user.id
    const req = await request.json();
    const input = UserKeys.parse(req);

    await sql.begin(async (sql) => {
        await sql`
                    update profiles
                    set username = ${input.username}
                    where id = ${userId};
                `;
        await sql`
                    insert into user_devices (id, device_id)
                    values (${userId}, ${input.deviceId});
                `;
        await sql`
                    insert into user_identity_keys (id, curve25519, ed25519)
                    values (${userId}, ${input.identityKeys.curve25519}, ${input.identityKeys.ed25519});
                `;

        for (const key of input.oneTimeKeys) {
            await sql`
                        insert into user_one_time_keys (id, curve25519, device_id)
                        values (${userId}, ${key}, ${input.deviceId});`;
        }
    });

    return json({ ok: true });
};

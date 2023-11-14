import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import sql from '$lib/server/db';

const Input = z.object({ userId: z.string(), deviceId: z.string() });

export const GET: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) {
        // the user is not signed in
        throw error(401, { message: 'Unauthorized' });
    }

    const url = new URL(request.url);
    const { userId, deviceId } = Input.parse(Object.fromEntries(url.searchParams.entries()));

    const key = await sql.begin(async (sql) => {
        const [{ curve25519 }] = await sql`
                    SELECT curve25519
                    FROM user_one_time_keys
                    WHERE id = ${userId} AND device_id = ${deviceId}
                    LIMIT 1;
                `;

        await sql`
                    DELETE FROM user_one_time_keys
                    WHERE id = ${userId} AND device_id = ${deviceId} AND curve25519 = ${curve25519};
                `;

        return curve25519;
    })
    console.log('key', key);
    return json({
        key
    })
};

import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import sql from '$lib/server/db';
import { z } from 'zod';

const UserDevices = z.array(z.object({
    device_id: z.string(),
    curve25519: z.string(),
    ed25519: z.string()
}))

type UserDevices = z.infer<typeof UserDevices>;

export const GET: RequestHandler = async ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId');

    if (userId === null) {
        return error(400, 'userId is required')
    }

    const rows = await sql<UserDevices>`
        select uik.device_id, curve25519, ed25519
        from user_devices
                 join public.user_identity_keys uik on user_devices.device_id = uik.device_id
        where user_devices.id = ${userId};
    `;

    return json([...rows]);
};

import { router, publicProcedure } from '$lib/trpc/trpc';
import { z } from 'zod';
import sql from '$lib/server/db';
import { ulid } from 'ulidx';
import { raise } from '$lib/utils';

const UserKeys = z.object({
    deviceId: z.string(),
    identityKeys: z.object({
        ed25519: z.string(),
        curve25519: z.string()
    }),
    oneTimeKeys: z.array(z.string())
});
const UserDevices = z.array(z.object({
    device_id: z.string(),
    curve25519: z.string(),
    ed25519: z.string()
}))

type UserDevices = z.infer<typeof UserDevices>;
export const usersRouter = router({
    updateProfile: publicProcedure
        .input(UserKeys)
        .mutation(async ({ ctx: { supabase }, input }) => {
            const session = (await supabase.auth.getSession()) ?? raise('unauthenticated');
            const userId =
                session.data.session?.user.id ?? raise(session.error?.message ?? 'unauthenticated');

            await sql.begin(async (sql) => {
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
        }),
    getDevicesForUser: publicProcedure
        .input(z.string())
        .output(UserDevices)
        .query(async ({ input: userId }) => {
            const rows = await sql<UserDevices>`
                select uik.device_id, curve25519, ed25519
                from user_devices
                         join public.user_identity_keys uik on user_devices.device_id = uik.device_id
                where user_devices.id = ${userId};  
            `;
            return [...rows];
        }),
    getOneTimeKey: publicProcedure
        .input(z.object({ userId: z.string(), deviceId: z.string() }))
        .output(z.string())
        .query(async ({ input: { userId, deviceId } }) => {
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
            return key
        })
});

export {};

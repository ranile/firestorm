import { router, publicProcedure } from '$lib/trpc/trpc';
import { z } from 'zod';
import sql from '$lib/server/db';
import { ulid } from 'ulidx';

const UserKeys = z.object({
    userId: z.string(),
    identityKeys: z.object({
        ed25519: z.string(),
        curve25519: z.string()
    }),
    oneTimeKeys: z.array(z.object({ key_id: z.string(), key: z.string() }))
});
export const usersRouter = router({
    updateProfile: publicProcedure
        .input(UserKeys)
        .mutation(async ({ ctx: { supabase }, input }) => {
            await sql.begin(async (sql) => {
                await sql`
                    insert into user_identity_keys (id, curve25519, ed25519)
                    values (${input.userId}, ${input.identityKeys.curve25519}, ${input.identityKeys.ed25519});
`

                for (const key of input.oneTimeKeys) {
                    await sql`
                        insert into user_one_time_keys (id, key_id, curve25519)
                        values (${input.userId}, ${key.key_id}, ${key.key});`
                }
            })
        })
});

export {};

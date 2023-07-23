import { router, publicProcedure } from '../trpc.ts';
import { z } from 'zod';
import { ulid } from 'https://deno.land/x/ulid@v0.2.0/mod.ts';

const AttachmentMetadata = z.object({
    name: z.string(),
    type: z.string(),
    key_ciphertext: z.string(),
    hashes: z.record(z.string())
});

export type AttachmentMetadata = z.infer<typeof AttachmentMetadata>;

const Attachment = AttachmentMetadata.extend({
    path: z.string()
});

export type Attachment = z.infer<typeof Attachment>;

const CreateMessage = z.object({
    uid: z.string(),
    files: z.array(
        AttachmentMetadata.extend({
            bytes: z.array(z.number())
        })
    ),
    roomId: z.string(),
    ciphertext: z.string(),
    replyTo: z.string().nullable()
});

export type CreateMessage = z.infer<typeof CreateMessage>;

export const messagesRouter = router({
    createMessage: publicProcedure
        .input(CreateMessage)
        .mutation(async ({ ctx: { supabase, db }, input }) => {
            const files: Attachment[] = [];
            for (const file of input.files) {
                const id = ulid();
                const bytes = new Uint8Array(file.bytes);
                const { data, error } = await supabase.storage
                    .from('attachments')
                    .upload(`attachments/${id}`, bytes, {
                        contentType: 'application/octet-stream'
                    });

                if (error !== null) {
                    console.error(error);
                    continue;
                }

                files.push({
                    path: data.path,
                    name: file.name,
                    type: file.type,
                    key_ciphertext: file.key_ciphertext,
                    hashes: file.hashes
                } satisfies Attachment);
            }

            const transaction = db.createTransaction('new_message_' + Date.now());
            await transaction.begin();

            const {
                rows: [{ id }]
            } = await transaction.queryObject`
                INSERT INTO messages (content, room_id, author_id, reply_to)
                VALUES (${input.ciphertext}, ${input.roomId}, ${input.uid}, ${input.replyTo})
                RETURNING id;
            `;

            for (const file of files) {
                const hashes = JSON.stringify(file.hashes);
                await transaction.queryObject`
                    INSERT INTO attachments (id, name, type, key_ciphertext, hashes, message_id)
                    VALUES ((SELECT id
                             FROM storage.objects
                             WHERE name = ${file.path}), ${file.name}, ${file.type},
                            ${file.key_ciphertext}, ${hashes}::jsonb, ${id})
                `;
            }

            await transaction.commit();
        })
});

export {};

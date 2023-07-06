import { z } from "zod";


export interface Notification {
    op: 'MessageCreate',
    content: Message
}

export const Room = z.object({
    id: z.string(),
    name: z.string(),
});

export const Author = z.object({
    id: z.string(),
    username: z.string(),
    avatar: z.string().nullable(),
});

export const Message = z.object({
    id: z.string(),
    room: Room,
    author: Author,
    content: z.string(),
    created_at: z.string(),
});

export const SubscriptionKeys = z.object({
    p256dh: z.string(),
    auth: z.string(),
});

export const SubscriptionInfo = z.object({
    endpoint: z.string(),
    keys: SubscriptionKeys,
});

export const Payload = z.object({
    channel: z.string(),
    message: Message,
    subscribers: z.array(SubscriptionInfo).nullable(),
});

export type Room = z.infer<typeof Room>;
export type Author = z.infer<typeof Author>;
export type Message = z.infer<typeof Message>;
export type SubscriptionKeys = z.infer<typeof SubscriptionKeys>;
export type SubscriptionInfo = z.infer<typeof SubscriptionInfo>;
export type Payload = z.infer<typeof Payload>;

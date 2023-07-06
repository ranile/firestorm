import { messagesRouter } from '$lib/trpc/routes/messages';
import { router } from '$lib/trpc/trpc';

export const appRouter = router({
    messages: messagesRouter
});

export type Router = typeof appRouter;

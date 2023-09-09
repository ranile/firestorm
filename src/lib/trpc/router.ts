import { messagesRouter } from '$lib/trpc/routes/messages';
import { router } from '$lib/trpc/trpc';
import { usersRouter } from '$lib/trpc/routes/users';

export const appRouter = router({
    messages: messagesRouter,
    users: usersRouter
});

export type Router = typeof appRouter;

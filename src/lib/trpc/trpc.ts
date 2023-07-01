import type { Context } from '$lib/trpc/context';
import { initTRPC } from '@trpc/server';

export const t = initTRPC.context<Context>().create();
export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;

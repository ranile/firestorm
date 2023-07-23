import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
import { type FetchCreateContextFn, fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { router } from '../_shared/trpc.ts'
import { messagesRouter } from '../_shared/routes/messages.ts'
import { pool } from '../_shared/db.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const appRouter = router({
  messages: messagesRouter
});

export type AppRouter = typeof appRouter;

const app = new Application();
const oakRouter = new Router();

oakRouter.all('/(.*)', async (ctx) => {
  const res = await fetchRequestHandler({
      endpoint: '/trpc',
      req: new Request(ctx.request.url, {
          headers: ctx.request.headers,
          body:
              ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD'
                  ? ctx.request.body({ type: 'stream' }).value
                  : void 0,
          method: ctx.request.method
      }),
      router: appRouter,
      createContext: (async ({ req }) => {
          const connection = await pool.connect();

          // Create a Supabase client with the Auth context of the logged in user.
          const supabaseClient = createClient(
              // Supabase API URL - env var exported by default.
              Deno.env.get('SUPABASE_URL') ?? '',
              // Supabase API ANON KEY - env var exported by default.
              Deno.env.get('SUPABASE_ANON_KEY') ?? '',
              // Create client with Auth context of the user that called the function.
              // This way your row-level-security (RLS) policies are applied.
              {
                global: { headers: { Authorization: req.headers.get('Authorization')! } },
                auth: {
                  persistSession: false
                }
              }
          );

          const {
              data: { user }
          } = await supabaseClient.auth.getUser();

          return {
              db: connection,
              supabase: supabaseClient,
              user
          };
      }) satisfies FetchCreateContextFn<AppRouter>
  });

  res.headers.append('Access-Control-Allow-Origin', '*')

  ctx.response.status = res.status;
  ctx.response.headers = res.headers;
  ctx.response.body = res.body;
});

app.use(oakCors()); // Enable CORS for All Routes
app.use(oakRouter.routes());
app.use(oakRouter.allowedMethods());

await app.listen({ port: 9999 });
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    return new Response('pong', { status: 200 });
};

export const POST: RequestHandler = async (event) => {
    const body = await event.request.text();
    console.log(body);
    return new Response('pong', { status: 200 });
};

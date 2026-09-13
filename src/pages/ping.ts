import type { APIRoute } from "astro";

// Temporary diagnostic route: proves whether the Cloudflare Worker's
// dynamic (non-prerendered) request handling runs in production at all.
export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response("pong " + new Date().toISOString(), {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
};

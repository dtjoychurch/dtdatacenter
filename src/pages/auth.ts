import type { APIRoute } from "astro";
import { getOAuthEnv } from "@lib/cloudflareEnv";

// Starts the GitHub OAuth flow for the Sveltia CMS admin at /admin.
// See src/pages/callback.ts for the other half of the handshake.
export const prerender = false;

export const GET: APIRoute = async ({ url, redirect, cookies, locals }) => {
  const { GITHUB_CLIENT_ID } = getOAuthEnv(locals);
  if (!GITHUB_CLIENT_ID) {
    return new Response("Missing GITHUB_CLIENT_ID binding", { status: 500 });
  }

  const state = crypto.randomUUID();
  cookies.set("oauth_state", state, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
  });

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", `${url.origin}/callback`);
  authorizeUrl.searchParams.set("scope", "repo");
  authorizeUrl.searchParams.set("state", state);

  return redirect(authorizeUrl.toString(), 302);
};

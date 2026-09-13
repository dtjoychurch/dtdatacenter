import type { APIContext } from "astro";

// Astro's Cloudflare adapter exposes Worker bindings/secrets via locals.runtime.env.
// We type just the keys we use rather than generating the full Env from wrangler.
export interface OAuthEnv {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export const getOAuthEnv = (locals: APIContext["locals"]): OAuthEnv => {
  return ((locals as { runtime?: { env?: OAuthEnv } }).runtime?.env ?? {}) as OAuthEnv;
};

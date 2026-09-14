import type { APIRoute } from "astro";
import { getOAuthEnv } from "@lib/cloudflareEnv";

// Completes the GitHub OAuth handshake and hands the token back to the CMS
// popup window via postMessage, following the protocol Decap/Sveltia CMS
// expect. See src/pages/gh-login.ts for why this isn't named "callback".
export const prerender = false;

const renderHandshake = (status: "success" | "error", payload: Record<string, string>) => {
  const json = JSON.stringify(payload)
    .replace(/</g, "\\u003c")
    .replace(/'/g, "\\'");

  return `<!doctype html>
<html>
  <body>
    <script>
      (function () {
        function receiveMessage(e) {
          window.opener.postMessage(
            'authorization:github:${status}:${json}',
            e.origin,
          );
          window.removeEventListener("message", receiveMessage, false);
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script>
  </body>
</html>`;
};

const htmlResponse = (body: string, status: number) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

export const GET: APIRoute = async ({ url, cookies, locals }) => {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = getOAuthEnv(locals);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = cookies.get("oauth_state")?.value;
  cookies.delete("oauth_state", { path: "/" });

  if (!code || !state || !savedState || state !== savedState) {
    return htmlResponse(
      renderHandshake("error", { message: "無效的登入請求，請重新嘗試登入。" }),
      400,
    );
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/gh-callback`,
    }),
  });

  const tokenData: { access_token?: string; error?: string; error_description?: string } =
    await tokenRes.json();

  if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
    return htmlResponse(
      renderHandshake("error", {
        message: tokenData.error_description || "無法從 GitHub 取得授權，請重新嘗試登入。",
      }),
      400,
    );
  }

  return htmlResponse(
    renderHandshake("success", { token: tokenData.access_token, provider: "github" }),
    200,
  );
};

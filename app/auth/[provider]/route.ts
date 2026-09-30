import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { beginLogin } from "@/lib/members";
import { authorizeUrl, enabledProviders } from "@/lib/oauth";
import { isProvider, safeNext } from "@/lib/profile";

// GET /auth/<provider>?next=/path: sends the visitor to the provider's login page.
export async function GET(
  request: NextRequest,
  context: RouteContext<"/auth/[provider]">,
) {
  const { provider } = await context.params;
  if (!isProvider(provider) || !enabledProviders().includes(provider))
    return new Response("Not found", { status: 404 });
  const state = await beginLogin(
    provider,
    safeNext(request.nextUrl.searchParams.get("next")),
  );
  redirect(authorizeUrl(provider, state));
}

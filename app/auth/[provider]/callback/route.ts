import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { findMember, touchMemberLogin } from "@/lib/db";
import { beginSignup, finishLogin, startSession } from "@/lib/members";
import { fetchProfile } from "@/lib/oauth";
import { isProvider, type Profile } from "@/lib/profile";

// GET /auth/<provider>/callback?code=…&state=…: the provider sends the visitor back here.
export async function GET(
  request: NextRequest,
  context: RouteContext<"/auth/[provider]/callback">,
) {
  const { provider } = await context.params;
  if (!isProvider(provider)) return new Response("Not found", { status: 404 });
  const query = request.nextUrl.searchParams;
  const back = (error: string, next = "/") =>
    `/login?error=${error}&next=${encodeURIComponent(next)}`;

  const attempt = await finishLogin(provider, query.get("state"));
  if (!attempt) redirect(back("state"));
  const code = query.get("code");
  if (query.get("error") || !code) redirect(back("denied", attempt.next)); // cancelled at the provider

  let profile: Profile;
  try {
    profile = await fetchProfile(provider, code, query.get("state")!);
  } catch (error) {
    console.error(`${provider} login failed:`, error); // status and URL only, no member data
    redirect(back("provider", attempt.next));
  }

  const member = await findMember(provider, profile.providerId);
  if (member) {
    touchMemberLogin(member.id);
    await startSession(member.id);
    redirect(attempt.next);
  }
  await beginSignup(profile, attempt.next);
  redirect("/signup");
}

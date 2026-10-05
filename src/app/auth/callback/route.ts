import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectUrl } from "@/lib/validations/auth";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const type = requestUrl.searchParams.get("type");

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        if (type === "recovery" || next === "/reset-password") {
          return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
        }

        const safeDestination = getSafeRedirectUrl(next, "/onboarding");
        return NextResponse.redirect(new URL(safeDestination, requestUrl.origin));
      }
    } catch {
      // Fall through to failure redirect on unexpected server/auth error
    }
  }

  // Redirect to login with error query parameter on failure or missing code
  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", requestUrl.origin));
}

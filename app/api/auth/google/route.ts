import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  googleRedirectUri,
} from "@/app/lib/oauthState";
import { safeNext } from "@/app/lib/safeNext";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      {
        error:
          "Missing GOOGLE_CLIENT_ID environment variable. Check your .env.local file and restart the server.",
      },
      { status: 500 },
    );
  }

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  // Random per-login value, echoed back by Google and checked against this
  // cookie in the callback. Stops other sites from completing a login for you.
  const state = randomBytes(32).toString("base64url");

  const options = {
    redirect_uri: googleRedirectUri(request),
    client_id: clientId,
    access_type: "online",
    response_type: "code",
    prompt: "select_account",
    state,
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);
  const response = NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 10 * 60,
    path: "/api/auth/google",
  };
  response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions);
  // Remember where to land after Google sends the user back.
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  response.cookies.set(OAUTH_NEXT_COOKIE, next, cookieOptions);
  return response;
}

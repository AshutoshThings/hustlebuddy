import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  console.log("Loaded Client ID:", clientId ? "Found" : "Missing");

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

  const options = {
    redirect_uri:
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/api/auth/google/callback",
    client_id: clientId,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);
  return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}

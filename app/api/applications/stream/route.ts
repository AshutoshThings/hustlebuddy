import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const clients = new Map<number, ReadableStreamDefaultController[]>();

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tokenParam = url.searchParams.get("token");

    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, ...v] = c.split("=");
        return [key, decodeURIComponent(v.join("="))];
      }),
    );

    const token = tokenParam || cookies.accessToken || cookies.refreshToken;
    if (!token) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: corsHeaders(),
      });
    }

    const secret =
      process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET || "";
    const decoded: any = jwt.verify(token, secret);
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: corsHeaders(),
      });
    }

    const stream = new ReadableStream({
      start(controller) {
        if (!clients.has(userId)) {
          clients.set(userId, []);
        }
        clients.get(userId)!.push(controller);

        controller.enqueue(new TextEncoder().encode(": connected\n\n"));
      },
      cancel(controller) {
        const userClients = clients.get(userId) || [];
        clients.set(
          userId,
          userClients.filter((c) => c !== controller),
        );
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        ...corsHeaders(),
      },
    });
  } catch (err) {
    console.error("SSE Auth Error:", err);
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: corsHeaders(),
    });
  }
}

export function broadcastNewApplication(userId: number, application: any) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.length === 0) return;

  const payload = `data: ${JSON.stringify(application)}\n\n`;
  const encoded = new TextEncoder().encode(payload);

  userClients.forEach((controller) => {
    try {
      controller.enqueue(encoded);
    } catch (err) {
      console.error("Error streaming to client controller:", err);
    }
  });
}

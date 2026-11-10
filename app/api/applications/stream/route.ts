import { NextResponse } from "next/server";
import { getAuthUser } from "@/app/lib/getAuthUser";

const clients = new Map<number, ReadableStreamDefaultController[]>();

// Same-origin only: EventSource sends the httpOnly accessToken cookie, so no
// token ever goes in the URL (where it would end up in logs and history).
// Refresh tokens are never accepted here.
export async function GET(request: Request) {
  try {
    const auth = await getAuthUser(request);
    const userId = Number(auth?.userId);
    if (!auth || !Number.isInteger(userId) || userId <= 0) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let self: ReadableStreamDefaultController | null = null;
    const stream = new ReadableStream({
      start(controller) {
        self = controller;
        if (!clients.has(userId)) {
          clients.set(userId, []);
        }
        clients.get(userId)!.push(controller);

        controller.enqueue(new TextEncoder().encode(": connected\n\n"));
      },
      // cancel() receives the reason, not the controller, so use the one
      // captured in start() to remove this connection.
      cancel() {
        const remaining = (clients.get(userId) || []).filter((c) => c !== self);
        if (remaining.length) clients.set(userId, remaining);
        else clients.delete(userId);
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("SSE Auth Error:", err);
    return new NextResponse("Unauthorized", { status: 401 });
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

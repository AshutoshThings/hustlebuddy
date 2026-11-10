import { NextResponse } from "next/server";
import { getAuthUser } from "@/app/lib/getAuthUser";
import { subscribe, whenListening, type AppEvent } from "@/app/lib/realtime";

// Comment lines keep proxies and load balancers from closing an idle stream.
const PING_MS = 25_000;
// Streams end on their own before typical serverless time limits (Vercel's
// default is 300s). The client reconnects straight away when told to.
const MAX_STREAM_SECONDS = Number(process.env.SSE_MAX_SECONDS) || 270;

// Same-origin only: EventSource sends the httpOnly accessToken cookie, so no
// token ever goes in the URL (where it would end up in logs and history).
// Refresh tokens are never accepted here.
//
// Events:
//   message    an application was created (data: the row)
//   reconnect  the stream is ending; data.refresh says whether to refresh
//              the access token first, because it is about to expire
export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  const userId = Number(auth?.userId);
  if (!auth || !Number.isInteger(userId) || userId <= 0) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Stop shortly before the access token expires, so a stream never outlives
  // the session that opened it.
  const tokenSecondsLeft = auth.exp
    ? auth.exp - Math.floor(Date.now() / 1000) - 15
    : Infinity;
  const lifetime = Math.max(5, Math.min(MAX_STREAM_SECONDS, tokenSecondsLeft));
  const refresh = tokenSecondsLeft <= MAX_STREAM_SECONDS;

  const encoder = new TextEncoder();
  let cleanup = () => {};

  // Subscribe and wait for this instance's LISTEN before answering: the
  // browser treats the response as "live", and resyncs only on reconnects.
  // Events that arrive before the stream starts are held until it does.
  const pending: AppEvent[] = [];
  let deliver: (event: AppEvent) => void = (event) => {
    pending.push(event);
  };
  const unsubscribe = subscribe(userId, (event) => deliver(event));
  await whenListening();
  if (request.signal.aborted) {
    unsubscribe();
    return new NextResponse(null, { status: 204 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let open = true;
      const write = (text: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          cleanup();
        }
      };

      deliver = (event) =>
        write(`data: ${JSON.stringify(event.application)}\n\n`);
      const ping = setInterval(() => write(": ping\n\n"), PING_MS);
      const end = setTimeout(() => {
        write(`event: reconnect\ndata: ${JSON.stringify({ refresh })}\n\n`);
        cleanup();
        try {
          controller.close();
        } catch {}
      }, lifetime * 1000);

      cleanup = () => {
        if (!open) return;
        open = false;
        unsubscribe();
        clearInterval(ping);
        clearTimeout(end);
      };
      request.signal.addEventListener("abort", () => cleanup());

      write("retry: 3000\n: connected\n\n");
      pending.splice(0).forEach(deliver);
    },
    cancel() {
      cleanup();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

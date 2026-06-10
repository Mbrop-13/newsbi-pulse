import { NextRequest } from "next/server";
import { onFrame, onStep, hasSession } from "@/lib/services/browser-manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/browser/stream?sessionId=xxx
 * 
 * Server-Sent Events endpoint that streams live browser frames and
 * step updates to the client's VirtualBrowserCard component.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");

  if (!sessionId || !hasSession(sessionId)) {
    return new Response(
      JSON.stringify({ error: "Session not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", sessionId })}\n\n`)
      );

      // Register frame callback
      onFrame(sessionId, (frame: string) => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "frame", image: frame })}\n\n`
            )
          );
        } catch {
          // Stream closed
        }
      });

      // Register step callback
      onStep(sessionId, (step) => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "step", ...step })}\n\n`
            )
          );
        } catch {
          // Stream closed
        }
      });

      // Keep-alive ping every 15 seconds
      const keepAlive = setInterval(() => {
        try {
          if (!hasSession(sessionId)) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "closed" })}\n\n`
              )
            );
            controller.close();
            clearInterval(keepAlive);
            return;
          }
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

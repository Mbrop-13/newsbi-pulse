import { NextRequest } from "next/server";
import { hasSession } from "@/lib/services/browser-manager";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || "";
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

/**
 * GET /api/browser/stream?sessionId=xxx
 * 
 * Server-Sent Events endpoint that streams live browser frames and
 * step updates from Upstash Redis to support stateless serverless environments.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");

  if (!sessionId || !(await hasSession(sessionId))) {
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

      let lastFrame = "";
      let lastStepCount = 0;
      let intervalId: NodeJS.Timeout;

      // Polling helper
      const checkUpdates = async () => {
        try {
          if (redis) {
            // 1. Check if session exists
            const sessionExists = await redis.exists(`browser:session:${sessionId}`);
            if (!sessionExists) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "closed" })}\n\n`)
              );
              controller.close();
              clearInterval(intervalId);
              return;
            }

            // 2. Fetch and check frame
            const frame = await redis.get(`browser:frame:${sessionId}`);
            if (frame && typeof frame === "string" && frame !== lastFrame) {
              lastFrame = frame;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "frame", image: frame })}\n\n`)
              );
            }

            // 3. Fetch and check steps
            const stepsRaw = await redis.get(`browser:steps:${sessionId}`);
            if (stepsRaw) {
              const steps = typeof stepsRaw === "string" ? JSON.parse(stepsRaw) : stepsRaw;
              if (steps.length > lastStepCount) {
                const newSteps = steps.slice(lastStepCount);
                for (const step of newSteps) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "step", ...step })}\n\n`)
                  );
                }
                lastStepCount = steps.length;
              }
            }
          }
        } catch (err) {
          // Controller might have been closed, stop interval
          clearInterval(intervalId);
        }
      };

      // Perform initial check
      checkUpdates();

      // Poll every 1 second
      intervalId = setInterval(checkUpdates, 1000);

      // Clear interval on abort
      req.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
      });
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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkLimit, incrementUsage } from "@/lib/check-limits";
import { rateLimit, rateLimitResponse, TTS_LIMIT } from "@/lib/rate-limit";

// ── Audio Generation API Route ───────────────────
// Generates MP3 audio using Hugging Face XTTS-v2

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await rateLimit(`news-audio:${user.id}`, {
      ...TTS_LIMIT,
      failClosedInProd: true,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const limitCheck = await checkLimit(user.id, "tts_audio");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "Has alcanzado el límite de audios de tu plan actual.", code: "LIMIT_REACHED" },
        { status: 403 }
      );
    }

    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "HF_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { text, articleId } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text content is required" },
        { status: 400 }
      );
    }

    // Truncate text to reasonable length for TTS
    const truncatedText = text.slice(0, 2000);

    // Call Hugging Face Inference API for TTS
    const response = await fetch(
      "https://api-inference.huggingface.co/models/coqui/XTTS-v2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: truncatedText,
          parameters: {
            language: "es",
          },
        }),
      }
    );

    if (!response.ok) {
      // If XTTS-v2 is unavailable, fallback to another model
      const fallbackResponse = await fetch(
        "https://api-inference.huggingface.co/models/facebook/mms-tts-spa",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: truncatedText,
          }),
        }
      );

      if (!fallbackResponse.ok) {
        throw new Error(`HF API error: ${fallbackResponse.status}`);
      }

      const audioBuffer = await fallbackResponse.arrayBuffer();
      await incrementUsage(user.id, "tts_audio").catch(console.error);
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/flac",
          "Content-Disposition": `attachment; filename="newsbi-${articleId || "audio"}.flac"`,
        },
      });
    }

    const audioBuffer = await response.arrayBuffer();
    await incrementUsage(user.id, "tts_audio").catch(console.error);
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename="newsbi-${articleId || "audio"}.wav"`,
      },
    });
  } catch (error: unknown) {
    console.error("Audio generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate audio", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

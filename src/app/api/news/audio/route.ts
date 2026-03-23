import { NextRequest, NextResponse } from "next/server";

// ── Audio Generation API Route ───────────────────
// Generates MP3 audio using Hugging Face XTTS-v2

export async function POST(request: NextRequest) {
  try {
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
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/flac",
          "Content-Disposition": `attachment; filename="newsbi-${articleId || "audio"}.flac"`,
        },
      });
    }

    const audioBuffer = await response.arrayBuffer();
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

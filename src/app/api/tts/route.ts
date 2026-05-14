import { NextRequest, NextResponse } from "next/server";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { createClient } from "@/lib/supabase/server";
import { checkLimit, incrementUsage } from "@/lib/check-limits";
import { rateLimit, rateLimitResponse, TTS_LIMIT } from "@/lib/rate-limit";

const polly = new PollyClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Polly has a 3000 character limit per request, so we chunk if needed
const MAX_CHARS = 2900;

function splitText(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];
  
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHARS) {
      chunks.push(remaining);
      break;
    }
    // Find the last sentence break within the limit
    let splitAt = remaining.lastIndexOf(". ", MAX_CHARS);
    if (splitAt === -1 || splitAt < MAX_CHARS / 2) {
      splitAt = remaining.lastIndexOf(" ", MAX_CHARS);
    }
    if (splitAt === -1) splitAt = MAX_CHARS;
    
    chunks.push(remaining.slice(0, splitAt + 1));
    remaining = remaining.slice(splitAt + 1).trim();
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const { text, mode = "summary" } = await req.json();
    
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Burst protection
    const rl = rateLimit(`tts:${user.id}`, TTS_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    // Check TTS usage limits
    const limitCheck = await checkLimit(user.id, "tts_audio");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: "Has alcanzado el límite de audios de tu plan actual.", 
          code: "LIMIT_REACHED",
          details: limitCheck 
        }, 
        { status: 403 }
      );
    }

    // Optimization: For summary mode, limit to 500 chars max
    const inputText = mode === "summary" ? text.slice(0, 500) : text.slice(0, 6000);
    const chunks = splitText(inputText);
    
    // Synthesize each chunk
    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      const command = new SynthesizeSpeechCommand({
        Engine: "neural",
        LanguageCode: "es-US",
        VoiceId: "Lupe",
        OutputFormat: "mp3",
        Text: chunk,
        TextType: "text",
      });
      
      const response = await polly.send(command);
      
      if (response.AudioStream) {
        // Convert readable stream to buffer
        const audioBytes = await response.AudioStream.transformToByteArray();
        audioBuffers.push(Buffer.from(audioBytes));
      }
    }
    
    // Concatenate all MP3 chunks
    const finalAudio = Buffer.concat(audioBuffers);
    
    // Increment usage asynchronously
    await incrementUsage(user.id, "tts_audio").catch(console.error);
    
    return new NextResponse(finalAudio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": finalAudio.length.toString(),
        "Cache-Control": "public, max-age=86400", // Cache for 24h
      },
    });
  } catch (error: any) {
    console.error("[TTS] Polly error:", error);
    return NextResponse.json(
      { error: "TTS synthesis failed", details: error.message },
      { status: 500 }
    );
  }
}

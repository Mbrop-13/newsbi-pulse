import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from "@/lib/supabase/server";
import { checkLimit, incrementUsage } from "@/lib/check-limits";

export const maxDuration = 60;

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://reclu.cl',
    'X-Title': 'Reclu',
  }
});

export async function POST(req: NextRequest) {
  try {
    const { symbols } = await req.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: "Symbols are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Usar límite general de AI o un límite propio. Por ahora usamos ai_message para cobrar el uso
    const limitCheck = await checkLimit(user.id, "ai_message");
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: "Has alcanzado el límite de uso de IA de tu plan.",
        code: "LIMIT_REACHED",
        details: limitCheck,
      }, { status: 403 });
    }

    await incrementUsage(user.id, "ai_message").catch(console.error);

    const now = new Date();
    const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
    
    // Call DeepSeek V4 Flash via OpenRouter
    const { object } = await generateObject({
      model: openrouter('deepseek/deepseek-v4-flash'),
      schema: z.object({
        events: z.array(z.object({
          symbol: z.string(),
          company_name: z.string(),
          type: z.string().describe("Ej: 'Earnings', 'Dividendo', 'Split', 'Conferencia', 'Aprobación FDA'"),
          date: z.string().describe("Fecha ISO, ej: 2026-06-15T00:00:00Z"),
          description: z.string().optional()
        }))
      }),
      prompt: `Eres un analista financiero experto. Tu tarea es encontrar eventos corporativos reales y confirmados programados entre ${now.toISOString()} y ${futureDate.toISOString()} para estas empresas: ${symbols.join(', ')}.
Reglas estrictas:
1. NO inventes fechas. Si no hay un evento oficial anunciado en ese periodo para una empresa, NO devuelvas nada para esa empresa.
2. Solo debes proveer eventos reales y verificables, como:
   - Reportes de ganancias (Earnings) confirmados
   - Fechas ex-dividendo
   - Splits de acciones
   - Conferencias o eventos de inversores oficiales
3. Responde ÚNICAMENTE en JSON válido usando el esquema provisto.`
    });

    // Validar y ordenar los eventos
    let validEvents = object.events || [];
    validEvents = validEvents.filter(e => {
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d >= now;
    });
    
    validEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Guardar en caché
    const { error: upsertError } = await supabase.from('user_ai_calendar').upsert({
      user_id: user.id,
      events: validEvents,
      last_updated: new Date().toISOString()
    });
    
    if (upsertError) {
      console.error("Error guardando calendario AI en Supabase:", upsertError);
    }

    return NextResponse.json({ events: validEvents });
  } catch (error: any) {
    console.error("AI Calendar Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data } = await supabase.from('user_ai_calendar').select('*').eq('user_id', user.id).single();
    
    // Auto-clean past events
    let currentEvents = data?.events || [];
    if (currentEvents.length > 0) {
      const now = new Date();
      // Keep events that are from today onwards (we set time to start of day to avoid deleting events happening today)
      now.setHours(0, 0, 0, 0);
      
      const filteredEvents = currentEvents.filter((e: any) => {
        const eventDate = new Date(e.date);
        return eventDate >= now;
      });

      if (filteredEvents.length !== currentEvents.length) {
        // Save cleaned events back to DB
        await supabase.from('user_ai_calendar').update({ events: filteredEvents }).eq('user_id', user.id);
        currentEvents = filteredEvents;
      }
    }

    return NextResponse.json({ 
      events: currentEvents, 
      last_updated: data?.last_updated || null 
    });
  } catch (error: any) {
    console.error("AI Calendar Fetch Error:", error);
    // If table doesn't exist, just return empty
    return NextResponse.json({ events: [], last_updated: null });
  }
}

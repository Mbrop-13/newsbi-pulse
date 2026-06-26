import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from "@/lib/supabase/server";
import { containsArtifact, parseArtifact, actionsToFiles } from "@/lib/webbuilder-parser";
import { incrementTokenUsage, checkTokenLimit } from "@/lib/check-limits";
import { rateLimit, rateLimitResponse, GENERAL_API_LIMIT } from "@/lib/rate-limit";
import { z } from "zod";

const webBuilderFixSchema = z.object({
  error: z.string().min(1, "Error message is required"),
  files: z.record(z.string(), z.any()),
}).strict();

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit check
    const rl = await rateLimit(`wb-fix:${user.id}`, GENERAL_API_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const tokenLimit = await checkTokenLimit(user.id);
    if (!tokenLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: "Límite de tokens de IA agotado. No se pueden realizar correcciones automáticas." 
      }, { status: 403 });
    }

    const rawBody = await req.json();
    const parseResult = webBuilderFixSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.warn("[API_VALIDATION_ERROR]", parseResult.error.format());
      return NextResponse.json({ 
        error: "Invalid request payload", 
        details: parseResult.error.format() 
      }, { status: 400 });
    }

    const { error, files } = parseResult.data;

    const mimo = createOpenAI({
      baseURL: process.env.LLM_BASE_URL || 'https://api.xiaomimimo.com/v1',
      apiKey: process.env.LLM_API_KEY || process.env.MIMO_API_KEY,
    });

    const debugPrompt = `Eres un debugger experto de React, CSS y JavaScript. Tu tarea es analizar un error de compilación/ejecución ocurrido en un entorno de Sandpack (Vite + React) y los archivos actuales del proyecto, y generar las correcciones necesarias.

ERROR DETECTADO:
${error}

ARCHIVOS DEL PROYECTO:
${Object.entries(files).map(([path, code]) => `--- Archivo: ${path} ---\n${code}\n`).join('\n')}

REGLAS DE RESPUESTA:
1. Analiza con precisión la causa del error (por ejemplo, importaciones faltantes, referencias a variables no definidas, errores de sintaxis, etc.).
2. Genera las modificaciones correspondientes en formato XML de Maverlang Artifacts.
3. Responde ÚNICAMENTE con el bloque XML <maverlangArtifact> que contiene la o las acciones para corregir el error.
4. NUNCA uses acciones de tipo "file" para archivos que ya existen en el proyecto (puesto que esto sobrescribiría el archivo completo y borraría código útil). Debes usar exclusivamente type="update" con bloques SEARCH/REPLACE para realizar cambios puntuales que corrijan el error sin afectar el resto del código.
5. No incluyas explicaciones en lenguaje natural antes ni después del bloque XML. El formato debe ser estrictamente procesable por código.
6. Reglas del formato de diffs:
   - Cada bloque de modificación empieza con <<<SEARCH, seguido del código EXACTO a buscar
   - Separador === divide el código viejo del nuevo
   - Cierra con >>>
   - Usa type="update" para modificar solo las líneas con problemas.

Ejemplo de respuesta esperada:
<maverlangArtifact id="project" title="Auto Fix Error">
  <maverlangAction type="update" filePath="/src/App.tsx">
<<<<SEARCH
import { IconoFaltante } from "lucide-react";
====
import { Activity } from "lucide-react";
>>>>
  </maverlangAction>
</maverlangArtifact>
`;

    const { text, usage } = await generateText({
      model: mimo(process.env.LLM_MODEL_PRO || "xiaomi/mimo-v2.5-pro"),
      system: "Eres un servicio automatizado de depuración de código. Devuelves únicamente XML.",
      messages: [{ role: 'user', content: debugPrompt }],
      temperature: 0.1,
      maxTokens: 4096,
    });

    if (usage?.totalTokens) {
      await incrementTokenUsage(user.id, usage.totalTokens).catch(console.error);
    }

    let correctedFiles: Record<string, { code: string }> | null = null;
    if (containsArtifact(text)) {
      const parsed = parseArtifact(text);
      if (parsed && parsed.actions.length > 0) {
        const typedFiles: Record<string, { code: string }> = Object.fromEntries(
          Object.entries(files).map(([path, f]: any) => {
            const code = typeof f === 'object' && f !== null && 'code' in f ? String(f.code) : String(f);
            return [path, { code }];
          })
        );
        correctedFiles = actionsToFiles(parsed.actions, typedFiles);
      }
    }

    if (!correctedFiles) {
      return NextResponse.json({ success: false, error: "No se pudo generar un fix válido", rawResponse: text });
    }

    return NextResponse.json({ success: true, files: correctedFiles });

  } catch (err: any) {
    console.error("[WebBuilder Fix API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}

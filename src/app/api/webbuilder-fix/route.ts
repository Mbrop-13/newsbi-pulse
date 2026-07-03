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

    const apiKey = process.env.LLM_API_KEY || process.env.MIMO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "LLM_API_KEY o MIMO_API_KEY no configurada en el servidor. Configúrala en Vercel env vars." },
        { status: 500 }
      );
    }

    const mimo = createOpenAI({
      baseURL: process.env.LLM_BASE_URL || 'https://api.xiaomimimo.com/v1',
      apiKey,
    });

    const debugPrompt = `Eres un debugger experto de React, TypeScript, CSS y JavaScript en un entorno Sandpack (Vite + React). Analiza un error de compilación/ejecución y los archivos actuales del proyecto, y genera la corrección MÍNIMA necesaria.

ERROR DETECTADO:
${error}

ARCHIVOS DEL PROYECTO:
${Object.entries(files).map(([path, code]) => `--- Archivo: ${path} ---\n${code}\n`).join('\n')}

METODOLOGÍA (síguela estrictamente):
1. Identifica el ARCHIVO y LÍNEA exactos del error a partir del mensaje (formatos como "/App.tsx:5:12" o "App.tsx line 5").
2. Diagnostica la causa raíz con precisión: import faltante, variable/identificador no definido, error de sintaxis, tipo incorrecto, hook usado fuera de componente, dependencia circular, export inexistente, etc.
3. Si el error es "Module not found" para un paquete npm, NO es un error de código: responde con un artifact vacío (un <maverlangAction> sin cambios) para no tocar archivos. El bundler instalará la dependencia automáticamente.
4. Aplica el cambio MÍNIMO que corrija el error sin afectar código funcional adyacente. No refactorices ni reorganices nada que no sea estrictamente necesario.
5. Si necesitas añadir un import, usa un bloque SEARCH que capture la línea del import más cercana y REPLACE añadiendo la nueva importación.
6. Si el error es de runtime (no de compilación), localiza el componente/effect causante y aplica el fix en su lógica, no en la capa de tipos.

REGLAS DE RESPUESTA:
1. Responde ÚNICAMENTE con el bloque XML <maverlangArtifact>. Sin texto antes ni después.
2. NUNCA uses acciones type="file" para archivos que ya existen: sobrescribiría el archivo completo y borraría código útil. Usa EXCLUSIVAMENTE type="update" con bloques SEARCH/REPLACE para cambios puntuales.
3. Usa type="file" SOLO si necesitas crear un archivo NUEVO que no existe (por ejemplo, un módulo cuyo import falta).
4. Si el error no requiere cambios en el código (ej: dep faltante que se instalará sola), devuelve:
<maverlangArtifact id="project" title="No Fix Needed"></maverlangArtifact>
5. Formato de diffs (estricto):
   - Cada bloque empieza con <<<SEARCH
   - Separador === divide el código viejo (a buscar EXACTO) del nuevo
   - Cierra con >>>
   - El contenido de SEARCH debe coincidir carácter por carácter con el código actual (incluida indentación). Si no estás seguro del whitespace exacto, usa la línea más corta y única posible.
6. No incluyas explicaciones en lenguaje natural. El formato debe ser procesable por código.

Ejemplo de respuesta:
<maverlangArtifact id="project" title="Auto Fix Error">
  <maverlangAction type="update" filePath="/App.tsx">
<<<SEARCH
import { IconoFaltante } from "lucide-react";
===
import { Activity } from "lucide-react";
>>>
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
    let warnings: { filePath: string; reason: string }[] = [];
    if (containsArtifact(text)) {
      const parsed = parseArtifact(text);
      if (parsed && parsed.actions.length > 0) {
        const typedFiles: Record<string, { code: string }> = Object.fromEntries(
          Object.entries(files).map(([path, f]: any) => {
            const code = typeof f === 'object' && f !== null && 'code' in f ? String(f.code) : String(f);
            return [path, { code }];
          })
        );
        const { files: applied, failedUpdates } = actionsToFiles(parsed.actions, typedFiles);
        correctedFiles = applied;
        warnings = failedUpdates.map(f => ({ filePath: f.filePath, reason: f.reason }));
      }
    }

    if (!correctedFiles) {
      return NextResponse.json({ success: false, error: "No se pudo generar un fix válido", rawResponse: text });
    }

    return NextResponse.json({ success: true, files: correctedFiles, warnings });

  } catch (err: any) {
    console.error("[WebBuilder Fix API] Error:", err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}

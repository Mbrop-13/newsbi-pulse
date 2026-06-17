import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from "@/lib/supabase/server";
import { containsArtifact, parseArtifact, actionsToFiles } from "@/lib/webbuilder-parser";
import { incrementTokenUsage, checkTokenLimit } from "@/lib/check-limits";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokenLimit = await checkTokenLimit(user.id);
    if (!tokenLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: "Límite de tokens de IA agotado. No se pueden realizar correcciones automáticas." 
      }, { status: 403 });
    }

    const { error, files } = await req.json();

    if (!error) {
      return NextResponse.json({ error: "Error message is required" }, { status: 400 });
    }
    if (!files || typeof files !== "object") {
      return NextResponse.json({ error: "Files are required" }, { status: 400 });
    }

    const mimo = createOpenAI({
      baseURL: 'https://api.xiaomimimo.com/v1',
      apiKey: process.env.MIMO_API_KEY,
    });

    const debugPrompt = `Eres un debugger experto de React, CSS y JavaScript. Tu tarea es analizar un error de compilación/ejecución ocurrido en un entorno de Sandpack (Vite + React) y los archivos actuales del proyecto, y generar las correcciones necesarias.

ERROR DETECTADO:
${error}

ARCHIVOS DEL PROYECTO:
${Object.entries(files).map(([path, code]) => `--- Archivo: ${path} ---\n${code}\n`).join('\n')}

REGLAS DE RESPUESTA:
1. Analiza con precisión la causa del error (por ejemplo, importaciones faltantes, referencias a variables no definidas, errores de sintaxis, etc.).
2. Genera las modificaciones correspondientes en formato XML de Maverlang Artifacts.
3. Responde ÚNICAMENTE con el bloque XML <maverlangArtifact> que contiene la o las acciones de tipo "update" (diff search/replace) o "file" (reemplazo completo) para corregir el error.
4. No incluyas explicaciones en lenguaje natural antes ni después del bloque XML. El formato debe ser estrictamente procesable por código.
5. Reglas del formato de diffs:
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
      model: mimo("xiaomi/mimo-v2.5-pro"),
      system: "Eres un servicio automatizado de depuración de código. Devuelves únicamente XML.",
      messages: [{ role: 'user', content: debugPrompt }],
      temperature: 0.1,
      maxTokens: 4096,
    });

    if (usage?.totalTokens) {
      await incrementTokenUsage(user.id, usage.totalTokens).catch(console.error);
    }

    let correctedFiles: Record<string, string> | null = null;
    if (containsArtifact(text)) {
      const parsed = parseArtifact(text);
      if (parsed && parsed.actions.length > 0) {
        // Map WebBuilderFile object files back to string records, apply diffs, and return as strings
        const flatFiles = Object.fromEntries(
          Object.entries(files).map(([path, f]: any) => [path, typeof f === 'object' ? f.code : String(f)])
        );
        const resultFlat = actionsToFiles(parsed.actions, flatFiles);
        correctedFiles = resultFlat;
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

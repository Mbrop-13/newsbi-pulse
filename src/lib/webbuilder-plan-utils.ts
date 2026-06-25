/**
 * Utilidades del modo Plan del WebBuilder.
 *
 * El usuario aprueba / cancela / ajusta un plan escribiendo en lenguaje
 * natural. Esta función clasifica su respuesta en una de tres intenciones para
 * que el cliente decida qué enviar al servidor:
 *  - "approve": construir el plan tal cual.
 *  - "reject":  cancelar el plan.
 *  - "feedback": replanificar incorporando el texto como cambios.
 *
 * Orden de prioridad: approve > reject > feedback. Es decir, si el mensaje
 * contiene una palabra de aprobación se aprueba aunque también mencione
 * "cambiar"; para pedir cambios hay que NO usar palabras de aprobación.
 */

const APPROVE_WORDS = [
  "aprobado", "aprovado", "aprobar", "aprovar", "aprueba", "aprueva", "apruebo", "apruevo",
  "aprobarlo", "aprovarlo", "aprobarla", "aprovarla", "aprobadlo", "aprovadlo",
  "sí", "si", "ok", "okay", "dale", "adelante", "adelántate",
  "continuar", "continúa", "continua", "procede", "proceder", "procedé",
  "ejecuta", "ejecutar", "construye", "construir", "hazlo", "confirmo",
  "confirmar", "avanza", "vamos", "empieza", "comienza", "perfecto", "listo", "bien", "excelente"
];

const REJECT_WORDS = [
  "cancelar", "cancela", "cancelo", "descartar", "descarta", "descarto",
  "detener", "detén", "deten", "parar", "para", "no", "nada", "stop",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .trim();
}

function containsAny(text: string, words: string[]): boolean {
  // Coincidencia de palabra completa para evitar falsos positivos como
  // "no" dentro de "naranja". Acepta la palabra aislada por espacios, inicio,
  // fin del texto, o signos de puntuación alrededor.
  return words.some((w) => new RegExp(`(^|[^a-záéíóúñ])${w}([^a-záéíóúñ]|$)`, "i").test(text));
}

export type PlanResponseIntent = "approve" | "reject" | "feedback";

export function classifyPlanResponse(text: string): PlanResponseIntent {
  const normalized = normalize(text);
  if (!normalized) return "feedback";

  // Aprobación tiene prioridad: si el usuario dice "aprobado" se construye.
  if (containsAny(normalized, APPROVE_WORDS)) return "approve";

  // Rechazo: "no", "cancelar", etc.
  if (containsAny(normalized, REJECT_WORDS)) return "reject";

  // Cualquier otra cosa se interpreta como cambios al plan.
  return "feedback";
}

/**
 * Utilidades del modo Plan del WebBuilder.
 *
 * El usuario aprueba / cancela / ajusta un plan escribiendo en lenguaje
 * natural (o con los botones de la tarjeta). Esta función clasifica su
 * respuesta en una de tres intenciones:
 *  - "approve": construir el plan tal cual.
 *  - "reject":  cancelar el plan.
 *  - "feedback": replanificar incorporando el texto como cambios.
 *
 * Palabras cortas y ambiguas ("ok", "sí", "bien") SOLO aprueban si el
 * mensaje es casi solo eso. Si hay más texto ("ok pero cambia el color")
 * se trata como feedback, no como aprobación.
 */

const EXPLICIT_APPROVE_WORDS = [
  "aprobado", "aprovado", "aprobar", "aprovar", "aprueba", "aprueva", "apruebo", "apruevo",
  "aprobarlo", "aprovarlo", "aprobarla", "aprovarla", "aprobadlo", "aprovadlo",
  "dale", "adelante", "adelantate",
  "ejecuta", "ejecutar", "construye", "construir", "hazlo", "confirmo", "confirmar",
];

const SHORT_APPROVE_ONLY = [
  "si", "ok", "okay", "vale", "va", "go", "yes",
];

const EXPLICIT_REJECT_WORDS = [
  "cancelar", "cancela", "cancelo", "descartar", "descarta", "descarto",
  "detener", "deten", "parar", "stop",
];

const SHORT_REJECT_ONLY = ["no", "nada"];

const CHANGE_WORDS = [
  "cambia", "cambiar", "cambio", "pero", "en vez", "en lugar",
  "agrega", "agregar", "quita", "quitar", "mejor", "tambien",
  "ademas", "excepto", "salvo", "en lugar de",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()"'“”‘’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text: string, words: string[]): boolean {
  return words.some((w) => new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`, "i").test(text));
}

export type PlanResponseIntent = "approve" | "reject" | "feedback";

export function classifyPlanResponse(text: string): PlanResponseIntent {
  const normalized = normalize(text);
  if (!normalized) return "feedback";

  const tokenCount = normalized.split(" ").filter(Boolean).length;
  const isShort = tokenCount <= 3;
  const wantsChanges = containsAny(normalized, CHANGE_WORDS);

  if (containsAny(normalized, EXPLICIT_APPROVE_WORDS) && !wantsChanges) {
    return "approve";
  }

  if (isShort && !wantsChanges && SHORT_APPROVE_ONLY.includes(normalized)) {
    return "approve";
  }

  if (containsAny(normalized, EXPLICIT_REJECT_WORDS) && isShort) {
    return "reject";
  }

  if (isShort && SHORT_REJECT_ONLY.includes(normalized)) {
    return "reject";
  }

  return "feedback";
}

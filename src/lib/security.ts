/**
 * Utility for detecting possible prompt injections or jailbreaks in user messages.
 */
export function detectSuspiciousPatterns(text: string): { isSuspicious: boolean; reason?: string } {
  if (!text || typeof text !== 'string') {
    return { isSuspicious: false };
  }

  const normalized = text.toLowerCase();

  // Known prompt injection / jailbreak patterns in Spanish and English
  const suspiciousKeywords = [
    "ignore previous instructions",
    "ignora las instrucciones anteriores",
    "ignora todas las instrucciones",
    "forget all rules",
    "olvida todas las reglas",
    "forget previous instructions",
    "olvida las instrucciones anteriores",
    "system override",
    "anular sistema",
    "you are now",
    "ahora eres",
    "act as",
    "actúa como",
    "jailbreak",
    "dan mode",
    "modo dan",
    "reveal your prompt",
    "revela tu prompt",
    "muestrame tu prompt",
    "system prompt",
    "prompt del sistema",
    "developer mode",
    "modo desarrollador",
    "ignore rules",
    "ignora las reglas",
    "bypass safety",
    "evadir seguridad",
    "instrucciones del sistema",
    "bypass constraints",
  ];

  for (const pattern of suspiciousKeywords) {
    if (normalized.includes(pattern)) {
      return {
        isSuspicious: true,
        reason: `Matched pattern: "${pattern}"`
      };
    }
  }

  // Check for suspicious character patterns or excessive repetition of instructions override characters
  if (normalized.includes("---") && (normalized.includes("system") || normalized.includes("user"))) {
    return {
      isSuspicious: true,
      reason: "Detected standard prompt injection separator delimiters"
    };
  }

  return { isSuspicious: false };
}

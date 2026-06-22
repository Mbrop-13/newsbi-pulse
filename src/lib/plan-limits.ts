/**
 * Maverlang — Plan Limits Configuration
 * 
 * Configuración centralizada de todos los límites por tier.
 * Edita SOLO este archivo para ajustar cualquier límite de la plataforma.
 */

export type PlanTier = "free" | "pro" | "max" | "ultra" | "ultra_x20";

export interface PlanConfig {
  id: PlanTier;
  name: string;
  price: number; // CLP mensual
  priceUSD: number; // USD mensual (referencia)
  annualDiscount: number; // porcentaje (0.2 = 20%)
  
  // ── Asistente IA ──
  aiMessagesPerMonth: number; // -1 = sin límite (en free se usa aiLifetimeMessages)
  aiLifetimeMessages: number; // Solo aplica a free (total de por vida)
  aiTokensPerMonth: number; // Límite de tokens mensuales (-1 = sin límite)
  aiLifetimeTokens: number; // Límite de tokens de por vida (solo free)
  aiModel: string; // Modelo de IA a usar
  aiChatHistory: number; // Cantidad de chats guardados (-1 = ilimitado)
  aiFileAttachments: boolean;
  aiAdvancedAnalysis: boolean;
  aiWebSearch: boolean;
  maxAgents: number; // Límite de agentes configurables
  
  // ── Audio TTS ──
  ttsAudiosPerMonth: number; // -1 = sin límite (en free es por día)
  ttsDailyLimit: number; // Solo aplica a free (audios por día)
  
  // ── Alertas ──
  maxActiveAlerts: number; // -1 = sin límite
  emailAlerts: boolean;
  smsAlerts: boolean;
  
  // ── Portafolio ──
  maxPortfolioAssets: number; // -1 = sin límite
  portfolioAnalysis: "none" | "basic" | "advanced" | "premium";
  weeklyPortfolioReport: boolean;
  
  // ── Contenido Premium ──
  weeklyNewsReport: boolean; // Informe semanal de noticias
  analysisRecommendations: boolean; // Recomendaciones de análisis
  adFree: boolean;
  
  // ── Diamantes ──
  diamondMultiplier: number; // Multiplicador diario
  
  // ── Soporte ──
  supportLevel: "community" | "email" | "priority" | "dedicated";
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    id: "free",
    name: "Gratuito",
    price: 0,
    priceUSD: 0,
    annualDiscount: 0,
    
    aiMessagesPerMonth: 0, // No usa mensual, usa lifetime
    aiLifetimeMessages: 5,
    aiTokensPerMonth: 0,
    aiLifetimeTokens: 50000,
    aiModel: "x-ai/grok-4.1-fast",
    aiChatHistory: 0,
    aiFileAttachments: false,
    aiAdvancedAnalysis: false,
    aiWebSearch: false,
    maxAgents: 6,
    
    ttsAudiosPerMonth: 0, // No usa mensual, usa diario
    ttsDailyLimit: 5,
    
    maxActiveAlerts: 2,
    emailAlerts: false,
    smsAlerts: false,
    
    maxPortfolioAssets: 5,
    portfolioAnalysis: "none",
    weeklyPortfolioReport: false,
    
    weeklyNewsReport: false,
    analysisRecommendations: false,
    adFree: false,
    
    diamondMultiplier: 0.5,
    
    supportLevel: "community",
  },
  
  pro: {
    id: "pro",
    name: "Pro",
    price: 22990,
    priceUSD: 24.99,
    annualDiscount: 0.2,
    
    aiMessagesPerMonth: 100,
    aiLifetimeMessages: -1,
    aiTokensPerMonth: 1000000,
    aiLifetimeTokens: -1,
    aiModel: "x-ai/grok-4.1-fast",
    aiChatHistory: 10,
    aiFileAttachments: true,
    aiAdvancedAnalysis: false,
    aiWebSearch: false,
    maxAgents: 20,
    
    ttsAudiosPerMonth: 50,
    ttsDailyLimit: -1,
    
    maxActiveAlerts: 5,
    emailAlerts: true,
    smsAlerts: false,
    
    maxPortfolioAssets: 25,
    portfolioAnalysis: "basic",
    weeklyPortfolioReport: false,
    
    weeklyNewsReport: false,
    analysisRecommendations: false,
    adFree: true,
    
    diamondMultiplier: 1,
    
    supportLevel: "email",
  },
  
  max: {
    id: "max",
    name: "Max",
    price: 43990,
    priceUSD: 45.99,
    annualDiscount: 0.2,
    
    aiMessagesPerMonth: 200, // x2 Pro
    aiLifetimeMessages: -1,
    aiTokensPerMonth: 2000000, // x2 Pro
    aiLifetimeTokens: -1,
    aiModel: "x-ai/grok-4.1-fast:online",
    aiChatHistory: 20, // x2 Pro
    aiFileAttachments: true,
    aiAdvancedAnalysis: true,
    aiWebSearch: false,
    maxAgents: 40, // x2 Pro
    
    ttsAudiosPerMonth: 100, // x2 Pro
    ttsDailyLimit: -1,
    
    maxActiveAlerts: 10, // x2 Pro
    emailAlerts: true,
    smsAlerts: true,
    
    maxPortfolioAssets: 50, // x2 Pro
    portfolioAnalysis: "advanced",
    weeklyPortfolioReport: true,
    
    weeklyNewsReport: true,
    analysisRecommendations: true,
    adFree: true,
    
    diamondMultiplier: 2,
    
    supportLevel: "priority",
  },
  
  ultra: {
    id: "ultra",
    name: "Ultra",
    price: 97990,
    priceUSD: 99.99,
    annualDiscount: 0.2,
    
    aiMessagesPerMonth: 500, // x5 Pro
    aiLifetimeMessages: -1,
    aiTokensPerMonth: 5000000, // x5 Pro
    aiLifetimeTokens: -1,
    aiModel: "x-ai/grok-4.1-fast:online",
    aiChatHistory: 50, // x5 Pro
    aiFileAttachments: true,
    aiAdvancedAnalysis: true,
    aiWebSearch: true,
    maxAgents: 100, // x5 Pro
    
    ttsAudiosPerMonth: 250, // x5 Pro
    ttsDailyLimit: -1,
    
    maxActiveAlerts: 25, // x5 Pro
    emailAlerts: true,
    smsAlerts: true,
    
    maxPortfolioAssets: 125, // x5 Pro
    portfolioAnalysis: "premium",
    weeklyPortfolioReport: true,
    
    weeklyNewsReport: true,
    analysisRecommendations: true,
    adFree: true,
    
    diamondMultiplier: 5,
    
    supportLevel: "dedicated",
  },

  ultra_x20: {
    id: "ultra_x20",
    name: "Ultra x20",
    price: 195980, // 97990 * 2
    priceUSD: 199.99,
    annualDiscount: 0.2,
    
    aiMessagesPerMonth: 2000, // x20 Pro
    aiLifetimeMessages: -1,
    aiTokensPerMonth: 20000000, // x20 Pro
    aiLifetimeTokens: -1,
    aiModel: "x-ai/grok-4.1-fast:online",
    aiChatHistory: 200, // x20 Pro
    aiFileAttachments: true,
    aiAdvancedAnalysis: true,
    aiWebSearch: true,
    maxAgents: 400, // x20 Pro
    
    ttsAudiosPerMonth: 1000, // x20 Pro
    ttsDailyLimit: -1,
    
    maxActiveAlerts: 100, // x20 Pro
    emailAlerts: true,
    smsAlerts: true,
    
    maxPortfolioAssets: 500, // x20 Pro
    portfolioAnalysis: "premium",
    weeklyPortfolioReport: true,
    
    weeklyNewsReport: true,
    analysisRecommendations: true,
    adFree: true,
    
    diamondMultiplier: 20,
    
    supportLevel: "dedicated",
  },
};

/**
 * Check if the end-of-month Promo X2 is active
 */
export function isPromoX2Active(): boolean {
  // Activa promoción temporalmente (por ejemplo, hasta fin de mes de Mayo 2026)
  return new Date() < new Date("2026-06-01T00:00:00Z");
}

/**
 * Get the plan config for a tier
 */
export function getPlanConfig(tier: PlanTier): PlanConfig {
  const baseConfig = PLAN_CONFIGS[tier] || PLAN_CONFIGS.free;
  
  // Si la promoción X2 está activa, duplicamos los beneficios de los planes de pago
  if (isPromoX2Active() && tier !== "free") {
    return {
      ...baseConfig,
      aiMessagesPerMonth: baseConfig.aiMessagesPerMonth * 2,
      aiTokensPerMonth: baseConfig.aiTokensPerMonth * 2,
      ttsAudiosPerMonth: baseConfig.ttsAudiosPerMonth * 2,
    };
  }
  
  return baseConfig;
}

/**
 * Get the next upgrade tier
 */
export function getNextTier(currentTier: PlanTier): PlanTier | null {
  const order: PlanTier[] = ["free", "pro", "max", "ultra", "ultra_x20"];
  const idx = order.indexOf(currentTier);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

/**
 * Format CLP price for display
 */
export function formatCLP(amount: number): string {
  return `$${amount.toLocaleString("es-CL")}`;
}

/**
 * Get monthly price with annual discount
 */
export function getAnnualMonthlyPrice(tier: PlanTier): number {
  const config = PLAN_CONFIGS[tier];
  return Math.round(config.price * (1 - config.annualDiscount));
}

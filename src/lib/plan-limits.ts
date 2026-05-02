/**
 * Reclu — Plan Limits Configuration
 * 
 * Configuración centralizada de todos los límites por tier.
 * Edita SOLO este archivo para ajustar cualquier límite de la plataforma.
 */

export type PlanTier = "free" | "pro" | "max" | "ultra";

export interface PlanConfig {
  id: PlanTier;
  name: string;
  price: number; // CLP mensual
  priceUSD: number; // USD mensual (referencia)
  annualDiscount: number; // porcentaje (0.2 = 20%)
  
  // ── Asistente IA ──
  aiMessagesPerMonth: number; // -1 = sin límite (en free se usa aiLifetimeMessages)
  aiLifetimeMessages: number; // Solo aplica a free (total de por vida)
  aiModel: string; // Modelo de IA a usar
  aiChatHistory: number; // Cantidad de chats guardados (-1 = ilimitado)
  aiFileAttachments: boolean;
  aiAdvancedAnalysis: boolean;
  aiWebSearch: boolean;
  
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
    aiModel: "x-ai/grok-4.1-fast",
    aiChatHistory: 0,
    aiFileAttachments: false,
    aiAdvancedAnalysis: false,
    aiWebSearch: false,
    
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
    price: 9990,
    priceUSD: 11.99,
    annualDiscount: 0.2,
    
    aiMessagesPerMonth: 100,
    aiLifetimeMessages: -1,
    aiModel: "x-ai/grok-4.1-fast",
    aiChatHistory: 10,
    aiFileAttachments: true,
    aiAdvancedAnalysis: false,
    aiWebSearch: false,
    
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
    price: 19990,
    priceUSD: 23.99,
    annualDiscount: 0.2,
    
    aiMessagesPerMonth: 300,
    aiLifetimeMessages: -1,
    aiModel: "x-ai/grok-4.1-fast:online",
    aiChatHistory: 50,
    aiFileAttachments: true,
    aiAdvancedAnalysis: true,
    aiWebSearch: false,
    
    ttsAudiosPerMonth: 150,
    ttsDailyLimit: -1,
    
    maxActiveAlerts: 15,
    emailAlerts: true,
    smsAlerts: true,
    
    maxPortfolioAssets: 100,
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
    price: 34990,
    priceUSD: 37.99,
    annualDiscount: 0.2,
    
    aiMessagesPerMonth: 600,
    aiLifetimeMessages: -1,
    aiModel: "x-ai/grok-4.1-fast:online",
    aiChatHistory: -1,
    aiFileAttachments: true,
    aiAdvancedAnalysis: true,
    aiWebSearch: true,
    
    ttsAudiosPerMonth: 300,
    ttsDailyLimit: -1,
    
    maxActiveAlerts: 30,
    emailAlerts: true,
    smsAlerts: true,
    
    maxPortfolioAssets: -1,
    portfolioAnalysis: "premium",
    weeklyPortfolioReport: true,
    
    weeklyNewsReport: true,
    analysisRecommendations: true,
    adFree: true,
    
    diamondMultiplier: 5,
    
    supportLevel: "dedicated",
  },
};

/**
 * Get the plan config for a tier
 */
export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLAN_CONFIGS[tier] || PLAN_CONFIGS.free;
}

/**
 * Get the next upgrade tier
 */
export function getNextTier(currentTier: PlanTier): PlanTier | null {
  const order: PlanTier[] = ["free", "pro", "max", "ultra"];
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

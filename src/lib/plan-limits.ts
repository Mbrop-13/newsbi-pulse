/**
 * Maverlang — Plan Limits Configuration
 * 
 * Configuración centralizada de todos los límites por tier.
 * Edita SOLO este archivo para ajustar cualquier límite de la plataforma.
 */

export type PlanTier = "free" | "pro" | "max" | "ultra" | "ultra_x20";

// ── Planes de Empresa (B2B, modelo por asiento) ──
export type EnterprisePlan = "team" | "business" | "enterprise";
export type BillingCycle = "monthly" | "annual";
export type OrgRole = "owner" | "admin" | "member";

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
  aiTokensPer5Hours: number; // Límite de tokens por 5 horas
  aiTokensPerWeek: number; // Límite de tokens por semana
  aiModel: string; // Modelo de IA a usar
  aiChatHistory: number; // Cantidad de chats guardados (-1 = ilimitado)
  imageCreditsPerMonth: number; // Créditos de imagen en Flow
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
    aiTokensPer5Hours: 10000,
    aiTokensPerWeek: 25000,
    aiModel: "x-ai/grok-4.1-fast",
    aiChatHistory: 0,
    imageCreditsPerMonth: 0,
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
    
    
    supportLevel: "community",
  },
  
  pro: {
    id: "pro",
    name: "Pro",
    price: 22990,
    priceUSD: 24.99,
    annualDiscount: 2 / 12,
    
    aiMessagesPerMonth: 100,
    aiLifetimeMessages: -1,
    aiTokensPerMonth: 1000000,
    aiLifetimeTokens: -1,
    aiTokensPer5Hours: 150000,
    aiTokensPerWeek: 400000,
    aiModel: "x-ai/grok-4.1-fast",
    aiChatHistory: 10,
    imageCreditsPerMonth: 1000,
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
    
    
    supportLevel: "email",
  },
  
  max: {
    id: "max",
    name: "Max",
    price: 43990,
    priceUSD: 45.99,
    annualDiscount: 2 / 12,
    
    aiMessagesPerMonth: 200, // x2 Pro
    aiLifetimeMessages: -1,
    aiTokensPerMonth: 2000000, // x2 Pro
    aiLifetimeTokens: -1,
    aiTokensPer5Hours: 300000,
    aiTokensPerWeek: 800000,
    aiModel: "x-ai/grok-4.1-fast:online",
    aiChatHistory: 20, // x2 Pro
    imageCreditsPerMonth: 2000,
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
    
    
    supportLevel: "priority",
  },
  
  ultra: {
    id: "ultra",
    name: "Ultra",
    price: 97990,
    priceUSD: 99.99,
    annualDiscount: 2 / 12,
    
    aiMessagesPerMonth: 500, // x5 Pro
    aiLifetimeMessages: -1,
    aiTokensPerMonth: 5000000, // x5 Pro
    aiLifetimeTokens: -1,
    aiTokensPer5Hours: 750000,
    aiTokensPerWeek: 2000000,
    aiModel: "x-ai/grok-4.1-fast:online",
    aiChatHistory: 50, // x5 Pro
    imageCreditsPerMonth: 5000,
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
    
    
    supportLevel: "dedicated",
  },

  ultra_x20: {
    id: "ultra_x20",
    name: "Ultra x20",
    price: 195980, // 97990 * 2
    priceUSD: 199.99,
    annualDiscount: 2 / 12,
    
    aiMessagesPerMonth: 2000, // x20 Pro
    aiLifetimeMessages: -1,
    aiTokensPerMonth: 20000000, // x20 Pro
    aiLifetimeTokens: -1,
    aiTokensPer5Hours: 3000000,
    aiTokensPerWeek: 8000000,
    aiModel: "x-ai/grok-4.1-fast:online",
    aiChatHistory: 200, // x20 Pro
    imageCreditsPerMonth: 10000,
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
      aiTokensPer5Hours: baseConfig.aiTokensPer5Hours * 2,
      aiTokensPerWeek: baseConfig.aiTokensPerWeek * 2,
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

// ============================================================================
// PLANES DE EMPRESA (B2B — modelo por asiento)
// ============================================================================

export interface EnterprisePlanConfig {
  id: EnterprisePlan;
  name: string;
  tagline: string;
  pricePerSeat: number;        // CLP mensual por asiento
  pricePerSeatUSD: number;     // USD referencia
  minSeats: number;
  maxSeats: number;            // -1 = ilimitado (enterprise)
  recommendedSeats: number;    // valor por defecto sugerido
  highlighted: boolean;        // plan recomendado (Popular)
  cta: "trial" | "contact";    // trial = checkout MP, contact = hablar con ventas
  annualDiscount: number;      // 2/12 = 2 meses gratis al pagar anual

  // Features incluidas por asiento
  aiMessagesPerSeatPerMonth: number;
  imageCreditsPerSeatPerMonth: number; // Créditos de imagen en Flow por asiento
  aiTokensPerSeatPerMonth: number;
  maxAlertsPerSeat: number;
  maxPortfolioAssetsPerSeat: number;
  aiModel: string;
  aiWebSearch: boolean;
  aiAdvancedAnalysis: boolean;
  adFree: boolean;

  // Features organizacionales
  sharedWorkspaces: boolean;
  sharedAgents: boolean;
  sharedAlerts: boolean;
  centralBilling: boolean;
  auditLog: boolean;
  adminDashboard: boolean;

  // Seguridad / SSO
  ssoType: "email" | "saml";
  allowedDomains: boolean;     // auto-join por dominio
  apiAccess: boolean;
  dataResidency: boolean;      // elección de región

  // Soporte
  supportLevel: "priority" | "dedicated";
  dedicatedCSM: boolean;       // Customer Success Manager
  onboardingSession: boolean;
  sla: string;                 // texto del SLA
}

export const ENTERPRISE_PLANS: Record<EnterprisePlan, EnterprisePlanConfig> = {
  team: {
    id: "team",
    name: "Team",
    tagline: "Para equipos pequeños que colaboran en finanzas.",
    pricePerSeat: 14990,
    pricePerSeatUSD: 15.99,
    minSeats: 3,
    maxSeats: 20,
    recommendedSeats: 5,
    highlighted: false,
    cta: "trial",
    annualDiscount: 2 / 12,
    aiMessagesPerSeatPerMonth: 200,
    imageCreditsPerSeatPerMonth: 2000,
    aiTokensPerSeatPerMonth: 2000000,
    maxAlertsPerSeat: 15,
    maxPortfolioAssetsPerSeat: 75,
    aiModel: "x-ai/grok-4.1-fast:online",
    aiWebSearch: false,
    aiAdvancedAnalysis: true,
    adFree: true,
    sharedWorkspaces: true,
    sharedAgents: false,
    sharedAlerts: true,
    centralBilling: true,
    auditLog: true,
    adminDashboard: true,
    ssoType: "email",
    allowedDomains: false,
    apiAccess: false,
    dataResidency: false,
    supportLevel: "priority",
    dedicatedCSM: false,
    onboardingSession: false,
    sla: "Respuesta en 24h hábiles",
  },

  business: {
    id: "business",
    name: "Business",
    tagline: "Para empresas en crecimiento con necesidades avanzadas.",
    pricePerSeat: 29990,
    pricePerSeatUSD: 32.99,
    minSeats: 5,
    maxSeats: 100,
    recommendedSeats: 15,
    highlighted: true, // Popular
    cta: "trial",
    annualDiscount: 2 / 12,
    aiMessagesPerSeatPerMonth: 500,
    imageCreditsPerSeatPerMonth: 5000,
    aiTokensPerSeatPerMonth: 5000000,
    maxAlertsPerSeat: 30,
    maxPortfolioAssetsPerSeat: 150,
    aiModel: "x-ai/grok-4.1-fast:online",
    aiWebSearch: true,
    aiAdvancedAnalysis: true,
    adFree: true,
    sharedWorkspaces: true,
    sharedAgents: true,
    sharedAlerts: true,
    centralBilling: true,
    auditLog: true,
    adminDashboard: true,
    ssoType: "email",
    allowedDomains: true,
    apiAccess: true,
    dataResidency: false,
    supportLevel: "priority",
    dedicatedCSM: true,
    onboardingSession: true,
    sla: "Respuesta en 4h hábiles + 99.9% uptime",
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Para grandes organizaciones con requisitos a medida.",
    pricePerSeat: 0, // "Hablemos"
    pricePerSeatUSD: 0,
    minSeats: 100,
    maxSeats: -1,
    recommendedSeats: 100,
    highlighted: false,
    cta: "contact",
    annualDiscount: 2 / 12,
    aiMessagesPerSeatPerMonth: 2000,
    imageCreditsPerSeatPerMonth: 10000,
    aiTokensPerSeatPerMonth: 20000000,
    maxAlertsPerSeat: 100,
    maxPortfolioAssetsPerSeat: 500,
    aiModel: "x-ai/grok-4.1-fast:online",
    aiWebSearch: true,
    aiAdvancedAnalysis: true,
    adFree: true,
    sharedWorkspaces: true,
    sharedAgents: true,
    sharedAlerts: true,
    centralBilling: true,
    auditLog: true,
    adminDashboard: true,
    ssoType: "saml",
    allowedDomains: true,
    apiAccess: true,
    dataResidency: true,
    supportLevel: "dedicated",
    dedicatedCSM: true,
    onboardingSession: true,
    sla: "SLA dedicado 99.99% + CSM asignado",
  },
};

/**
 * Mapeo de plan de empresa → tier individual equivalente (para getUserTier)
 */
export function enterpriseToTier(plan: EnterprisePlan): PlanTier {
  switch (plan) {
    case "team": return "max";
    case "business": return "ultra";
    case "enterprise": return "ultra_x20";
  }
}

/**
 * Calcula el total mensual para un plan de empresa dado un nº de asientos
 */
export function calculateSeatTotal(plan: EnterprisePlan, seats: number): number {
  const config = ENTERPRISE_PLANS[plan];
  if (config.pricePerSeat === 0) return 0;
  const clamped = Math.max(config.minSeats, Math.min(seats, config.maxSeats === -1 ? seats : config.maxSeats));
  return config.pricePerSeat * clamped;
}

/**
 * Calcula el total anual (con descuento de 2 meses gratis) para un plan de empresa
 */
export function calculateAnnualTotal(plan: EnterprisePlan, seats: number): number {
  const monthly = calculateSeatTotal(plan, seats);
  const config = ENTERPRISE_PLANS[plan];
  return Math.round(monthly * 12 * (1 - config.annualDiscount));
}

/**
 * Equivalente mensual al pagar anual
 */
export function getAnnualEquivalentMonthly(plan: EnterprisePlan, seats: number): number {
  return Math.round(calculateAnnualTotal(plan, seats) / 12);
}

/**
 * Ahorro anual al elegir ciclo anual (vs 12x mensual)
 */
export function getAnnualSavings(plan: EnterprisePlan, seats: number): number {
  return calculateSeatTotal(plan, seats) * 12 - calculateAnnualTotal(plan, seats);
}

/**
 * Obtiene la configuración de un plan de empresa
 */
export function getEnterprisePlanConfig(plan: EnterprisePlan): EnterprisePlanConfig {
  return ENTERPRISE_PLANS[plan] || ENTERPRISE_PLANS.team;
}

/**
 * Lista ordenada de planes de empresa
 */
export const ENTERPRISE_PLAN_ORDER: EnterprisePlan[] = ["team", "business", "enterprise"];

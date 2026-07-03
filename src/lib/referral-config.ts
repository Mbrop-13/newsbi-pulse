// Constantes del programa de referidos (client-safe, sin dependencias de servidor).
// Compartido entre src/lib/referrals.ts (servidor) y los componentes de UI.

/** Días base otorgados por cada referido que paga (siempre algo). */
export const BASE_REWARD_DAYS = 7;

export interface Milestone {
  threshold: number;
  days: number;
  badge: string;
}

/**
 * Umbrales escalables: al alcanzar `threshold` referidos cualificados se
 * otorgan `days` extra y se desbloquea `badge`.
 */
export const REFERRAL_MILESTONES: Milestone[] = [
  { threshold: 1, days: 15, badge: "Primer referido" },
  { threshold: 3, days: 30, badge: "En racha" },
  { threshold: 5, days: 60, badge: "Embajador Maverlang" },
  { threshold: 10, days: 120, badge: "Leyenda Maverlang" },
  { threshold: 25, days: 365, badge: "Maestro Maverlang" },
];

export interface NewsArticle {
  id: string;
  group_id: string | null;
  title: string;
  summary: string;
  content: string;
  enriched_content: string | null;
  sources: { name: string; url: string }[];
  ai_model: string | null;
  image_url: string | null;
  category: string;
  tags: string[];
  author: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
  is_live: boolean;
  live_youtube_url: string | null;
  audio_url: string | null;
  sentiment: "positive" | "negative" | "neutral" | null;
  relevance_score: number;
  embedding: number[] | null;
  slug: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface TickerItem {
  id: string;
  title: string;
  category: string;
  isLive: boolean;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentArticleId: string | null;
  currentTitle: string;
  currentAudioUrl: string | null;
  progress: number;
  duration: number;
}

export const CATEGORIES: NewsCategory[] = [
  { id: "all", name: "Inicio", slug: "inicio", icon: "Home" },
  { id: "live", name: "Live", slug: "live", icon: "Radio" },
  { id: "tech", name: "Tech", slug: "tech", icon: "Cpu" },
  { id: "chile", name: "Chile", slug: "chile", icon: "MapPin" },
  { id: "business", name: "Business", slug: "business", icon: "TrendingUp" },
  { id: "audio", name: "Audio", slug: "audio", icon: "Headphones" },
];

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  is_admin: boolean;
  message: string;
  created_at: string;
}

// ============================================================================
// Tipos Enterprise (B2B multi-tenant)
// ============================================================================

import type { EnterprisePlan, OrgRole, BillingCycle } from "@/lib/plan-limits";

export type OrgStatus = "trial" | "active" | "past_due" | "canceled";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  rut: string | null;
  billing_email: string | null;
  plan: EnterprisePlan;
  seat_count: number;
  billing_cycle: BillingCycle;
  status: OrgStatus;
  current_period_end: string | null;
  logo_url: string | null;
  allowed_domains: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: OrgRole;
  status: "active" | "invited" | "removed";
  joined_at: string;
  updated_at: string;
  // Joined fields (cuando se hace fetch con auth.users)
  name?: string;
  email?: string;
  avatar_url?: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  token: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  plan: EnterprisePlan;
  seats: number;
  status: OrgStatus;
  billing_cycle: BillingCycle;
  payment_provider: string;
  external_subscription_id: string | null;
  external_payer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseLead {
  id: string;
  name: string;
  email: string;
  company: string;
  rut: string | null;
  team_size: string | null;
  message: string | null;
  status: "new" | "contacted" | "won" | "lost";
  created_at: string;
}

/** Org + membresía del usuario actual + subscripción (vista compuesta) */
export interface UserOrgMembership {
  org: Organization;
  role: OrgRole;
  member: OrganizationMember;
  subscription: OrganizationSubscription | null;
  activeMemberCount: number;
}

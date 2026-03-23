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

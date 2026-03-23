# 🔺 NewsBI Pulse

**Plataforma de Noticias IA en Tiempo Real** — by [ProgramBI](https://programbi.com)

> Análisis inteligente, verificación de fuentes, audio profesional y cobertura en vivo. Impulsado por Grok AI (xAI).

---

## 🚀 Quick Start

### Prerrequisitos

- **Node.js** 18+ (recomendado 20+)
- **npm** 9+
- Cuenta en [Supabase](https://supabase.com) (para producción)

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/newsbi-pulse.git
cd newsbi-pulse
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus API keys:

| Variable | Servicio | Obtener en |
|---|---|---|
| `NEWSDATA_API_KEY` | NewsData.io | [newsdata.io](https://newsdata.io) |
| `XAI_API_KEY` | Grok / xAI | [x.ai](https://x.ai) |
| `YOUTUBE_API_KEY` | YouTube Data v3 | [Google Cloud Console](https://console.cloud.google.com) |
| `HF_API_KEY` | Hugging Face | [huggingface.co](https://huggingface.co/settings/tokens) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | [supabase.com](https://supabase.com) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Dashboard > Settings > API |
| `CRON_SECRET` | Vercel Cron | Genera uno aleatorio |

### 3. Iniciar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) 🎉

---

## 🏗️ Estructura del Proyecto

```
newsbi-pulse/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── news/
│   │   │   │   ├── fetch/route.ts      # NewsData.io fetch
│   │   │   │   ├── enrich/route.ts     # Grok AI enrichment
│   │   │   │   ├── audio/route.ts      # XTTS-v2 TTS generation
│   │   │   │   ├── live/route.ts       # YouTube live detection
│   │   │   │   └── deduplicate/route.ts # Embedding deduplication
│   │   │   ├── chat/route.ts           # Grok chat per article
│   │   │   └── cron/route.ts           # Scheduled news pipeline
│   │   ├── article/[id]/page.tsx       # Article detail page
│   │   ├── layout.tsx                  # Root layout + SEO
│   │   ├── page.tsx                    # Home page
│   │   └── globals.css                 # Design system
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── navbar.tsx                  # Fixed navigation
│   │   ├── hero-section.tsx            # Gradient hero
│   │   ├── news-card.tsx               # Article cards
│   │   ├── sidebar.tsx                 # Trending + AI chat
│   │   ├── live-ticker.tsx             # Breaking news ticker
│   │   ├── audio-player.tsx            # Global audio player
│   │   ├── category-filter.tsx         # Category tabs
│   │   ├── footer.tsx                  # Site footer
│   │   ├── logo.tsx                    # ProgramBI logo
│   │   ├── skeletons.tsx               # Loading states
│   │   └── theme-provider.tsx          # Dark/light mode
│   └── lib/
│       ├── types.ts                    # TypeScript types
│       ├── utils.ts                    # Utility functions
│       ├── supabase.ts                 # Supabase client
│       └── mock-data.ts               # Demo data
├── public/
│   └── manifest.json                   # PWA manifest
├── .env.example                        # Environment template
├── vercel.json                         # Vercel config + cron
└── README.md
```

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, TypeScript) |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Animations** | Framer Motion |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **AI Chat** | Grok API (xAI) with tool calling |
| **News Feed** | NewsData.io API |
| **Audio TTS** | XTTS-v2 / MMS-TTS (Hugging Face) |
| **Dedup** | sentence-transformers/all-MiniLM-L6-v2 |
| **Live Streams** | YouTube Data API v3 |
| **Hosting** | Vercel (serverless + cron) |

---

## 🔄 Pipeline de Noticias

```
NewsData.io → Fetch → Dedup (embeddings) → Enrich (Grok) → Audio (TTS) → Store (Supabase)
                                                  ↓
                                          YouTube Live Detection
```

1. **Fetch**: Cada 5 min via cron (tech, business, politics en español/Chile)
2. **Dedup**: Embeddings con `all-MiniLM-L6-v2` + cosine similarity (threshold 0.85)
3. **Enrich**: Grok con tool calling (`web_search` + `x_keyword_search`)
4. **Audio**: XTTS-v2 genera MP3 con voz profesional en español
5. **Live**: Detecta streams de YouTube (White House, eventos tech)

---

## 🌐 Deploy en Vercel (1-Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/newsbi-pulse)

### Deploy manual:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configura env vars en Vercel Dashboard
# Settings > Environment Variables > agrega todas las keys de .env.example
```

El `vercel.json` ya incluye el cron job configurado para ejecutarse cada 5 minutos.

---

## 📱 Supabase Schema

Ejecuta este SQL en tu Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  enriched_content TEXT,
  original_source TEXT,
  source_url TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  author TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_live BOOLEAN DEFAULT FALSE,
  live_youtube_url TEXT,
  audio_url TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  relevance_score FLOAT DEFAULT 0.5,
  embedding VECTOR(384)
);

CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_news_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_group ON news_articles(group_id);
CREATE INDEX idx_news_live ON news_articles(is_live) WHERE is_live = TRUE;
```

---

## 📝 Licencia

MIT © [ProgramBI](https://programbi.com)

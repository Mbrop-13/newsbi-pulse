# 🔺 NewsBI Pulse — Guía de Continuación para LLM

> **Documento técnico exhaustivo** para que un LLM continúe desarrollando NewsBI Pulse hasta convertirla en una plataforma de noticias IA de primer nivel mundial. Cada sección describe exactamente QUÉ falta, DÓNDE implementarlo, CÓMO hacerlo, y QUÉ archivos crear o modificar.

---

## 📋 Estado Actual del Proyecto (Marzo 2026)

### Lo que YA está implementado y funciona:
- ✅ Next.js 15 con App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion
- ✅ Diseño dark mode con paleta ProgramBI (#00A1FF, #1E2937, #22D3EE, #0F172A)
- ✅ Hero section con gradiente azul, badge "Impulsado por IA Grok", stats (24/7, Grok AI, 5 min)
- ✅ Live ticker horizontal con "BREAKING" badge (usa `MOCK_TICKER` en `src/lib/mock-data.ts`)
- ✅ Navbar fixed con glassmorphism on scroll, logo SVG, links de categoría, toggle dark/light
- ✅ Componente `NewsCard` con 3 variantes: featured, standard, compact (blue-glow hover)
- ✅ CategoryFilter animado con spring physics (layoutId de Framer Motion)
- ✅ Sidebar con Trending Ahora (lista numerada) + Chat IA "Pregúntale a Grok" (simulado)
- ✅ AudioPlayer global (bottom bar con progress, play/pause, volume — pero NO genera audio real aún)
- ✅ Página de detalle de artículo con contenido enriquecido, YouTube embed, per-article Grok chat
- ✅ Footer estilo ProgramBI con 4 columnas
- ✅ Loading skeletons para cards y sidebar
- ✅ 7 API routes: `news/fetch`, `news/enrich`, `news/deduplicate`, `news/audio`, `news/live`, `chat`, `cron`
- ✅ Mock data con 6 artículos realistas + 8 ticker items
- ✅ `.env.example`, `vercel.json` con cron, `manifest.json` PWA, SEO metadata
- ✅ Supabase client + schema SQL documentado en `src/lib/supabase.ts`

### Lo que FALTA o está incompleto:
- ❌ Los datos son 100% mock — no hay conexión real a APIs (NewsData.io, Grok, YouTube, HF)
- ❌ No hay autenticación ni cuentas de usuario
- ❌ El audio no se genera realmente (AudioPlayer existe pero no hay audio real)
- ❌ El chat de Grok usa respuestas simuladas (setTimeout)
- ❌ No hay base de datos conectada (Supabase client existe pero no hay queries reales)
- ❌ No hay búsqueda implementada
- ❌ No hay feed infinito real (solo los 6 mock articles)
- ❌ No hay sistema de notificaciones
- ❌ No hay PWA funcional (solo manifest.json, falta service worker)
- ❌ No hay tests
- ❌ No hay rate limiting implementado
- ❌ No hay error boundaries
- ❌ No hay analytics
- ❌ No hay internacionalización
- ❌ No hay sistema de bookmarks/favoritos
- ❌ El "Cargar más noticias" no hace nada
- ❌ La búsqueda del navbar no hace nada
- ❌ El botón "Escuchar artículo" en detail page no funciona

---

## 🏗️ MEJORAS DE DISEÑO Y UI/UX

### 1. Micro-animaciones y Polish Visual

**Archivos a modificar:** `src/components/news-card.tsx`, `src/components/navbar.tsx`, `src/app/globals.css`

**Implementar:**
- Añadir efecto parallax en las imágenes de `NewsCard` al hacer scroll (usar `useScroll` + `useTransform` de Framer Motion)
- Animación staggered al cargar las cards (actualmente solo tiene delay individual, falta un contenedor con `staggerChildren`)
- Skeleton shimmer effect más suave (actualmente usa el skeleton default de shadcn, agregar un efecto shimmer con `background: linear-gradient` animado)
- Hover 3D tilt en cards usando `perspective` y `rotateX/Y` basado en posición del mouse
- Transición de página suave entre home y article detail (usar `AnimatePresence` con `motion.div` wrapping las páginas)
- Pull-to-refresh en mobile
- Efecto de ripple en botones

**CSS a agregar en `globals.css`:**
```css
.shimmer {
  background: linear-gradient(90deg, transparent, rgba(0,161,255,0.05), transparent);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 2. Modo Light Completo

**Archivos a modificar:** `src/app/globals.css`, todos los componentes que usan clases `bg-white/5`, `text-white/50`, etc.

**Problema actual:** El modo light existe en variables CSS pero muchos componentes tienen colores hardcodeados para dark mode:
- `bg-white/5` → debería ser `bg-foreground/5` o usar variables
- `text-white/50` → debería ser `text-foreground/50`
- `border-white/10` → debería ser `border-foreground/10`
- La clase `glass` solo funciona en dark (`rgba(30, 41, 59, 0.7)`) — agregar variante `dark:glass` y `glass` para light
- El hero gradient `gradient-hero` necesita una versión light

**Buscar y reemplazar en todos los archivos de components:**
```
bg-white/5 → bg-foreground/5
text-white/20 → text-foreground/20
text-white/50 → text-foreground/50
text-white/60 → text-foreground/60
text-white/80 → text-foreground/80
border-white/5 → border-foreground/5
border-white/10 → border-foreground/10
```

### 3. Responsive Mejorado

**Archivos a modificar:** `src/components/hero-section.tsx`, `src/components/sidebar.tsx`, `src/app/page.tsx`

**Problemas actuales:**
- La sidebar en mobile no se muestra debajo del feed (se oculta con `lg:col-span-1`)
- Las stats del hero se ven apretadas en pantallas < 375px
- Las cards en mobile no tienen espaciado óptimo

**Solución:**
- En `page.tsx`, cambiar la sidebar para que aparezca como sheet en mobile (usar el componente Sheet de shadcn)
- Agregar un botón flotante "💬 Chat IA" en mobile que abra la sidebar como bottom sheet
- El hero necesita breakpoint `xs` (320px) con font sizes más pequeños

### 4. Navbar Mejorada

**Archivo:** `src/components/navbar.tsx`

**Agregar:**
- Indicador de categoría activa en desktop (actualmente solo cambia color, debería tener un underline animado)
- Badge de notificaciones (número rojo) junto al botón de búsqueda
- Avatar/icono de usuario para login/registro
- Barra de búsqueda expandible que se despliega inline al hacer click en el ícono de búsqueda (usar `AnimatePresence` + `motion.div` con `width` animado de 0 a 300px)
- Efecto blur del navbar debería ser más pronunciado (aumentar `blur(16px)` a `blur(24px)`)
- Breadcrumbs en la página de artículo

### 5. Cards Premium Extras

**Archivo:** `src/components/news-card.tsx`

**Agregar:**
- Indicador de sentimiento (barra de color: verde=positivo, rojo=negativo, gris=neutral) — usar `article.sentiment`
- Tiempo de lectura estimado (calcular: `Math.ceil(content.split(' ').length / 200)` minutos)
- Botón de bookmarks (ícono de marcador) en la esquina superior derecha de cada card
- Botón de compartir rápido (share API nativa del browser)
- Badge de "Verificado por IA" si `article.enriched_content` existe
- Mini progress bar de relevancia (`article.relevance_score`) visible en hover
- Variante "breaking" para noticias urgentes (borde rojo pulsante)

---

## 🔐 SISTEMA DE AUTENTICACIÓN Y CUENTAS

### 6. Autenticación con Supabase Auth

**Archivos a crear:**
- `src/lib/auth.ts` — helper functions de auth
- `src/components/auth/login-dialog.tsx` — modal de login
- `src/components/auth/register-dialog.tsx` — modal de registro
- `src/components/auth/user-menu.tsx` — dropdown del usuario logueado
- `src/app/api/auth/callback/route.ts` — callback para OAuth
- `src/middleware.ts` — middleware para proteger rutas

**Implementación:**

```typescript
// src/lib/auth.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  return supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/api/auth/callback` } })
}

export async function signOut() {
  return supabase.auth.signOut()
}
```

**Instalar:** `npm install @supabase/auth-helpers-nextjs @supabase/ssr`

**SQL Supabase adicional:**
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  preferred_categories TEXT[] DEFAULT '{}',
  preferred_language TEXT DEFAULT 'es',
  notification_enabled BOOLEAN DEFAULT TRUE,
  bookmarks UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_reading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  article_id UUID REFERENCES news_articles(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  read_duration_seconds INT DEFAULT 0
);
```

**En `navbar.tsx`:** Agregar al final del div de "Right side":
- Si no autenticado: botón "Iniciar Sesión" azul + "Registrarse" outline
- Si autenticado: Avatar con DropdownMenu (Mi Perfil, Mis Bookmarks, Historial, Preferencias, Cerrar Sesión)

### 7. Página de Perfil de Usuario

**Archivos a crear:**
- `src/app/profile/page.tsx`
- `src/app/profile/bookmarks/page.tsx`
- `src/app/profile/history/page.tsx`
- `src/app/profile/settings/page.tsx`

**Contenido de `/profile`:**
- Header con avatar, nombre, email, fecha de registro
- Stats: artículos leídos, tiempo total de lectura, categorías favoritas
- Grid de bookmarks guardados
- Historial de lectura (últimos 50 artículos)
- Preferencias: categorías favoritas (toggle chips), idioma, notificaciones push, tema (dark/light/auto)

---

## 🔊 SISTEMA DE AUDIO COMPLETO

### 8. Generación de Audio Real

**Archivos a modificar:** `src/app/api/news/audio/route.ts`, `src/components/audio-player.tsx`, `src/components/news-card.tsx`, `src/app/article/[id]/page.tsx`

**Estado actual:** El AudioPlayer existe como componente pero:
- El endpoint `api/news/audio` llama a HuggingFace pero no se invoca desde ningún lugar
- No hay storage para los archivos de audio generados
- El botón "Escuchar artículo" en el detail page no hace nada

**Implementación paso a paso:**

1. **Crear un servicio de audio** — `src/lib/audio-service.ts`:
```typescript
export async function generateArticleAudio(articleId: string, text: string): Promise<string> {
  // 1. Llamar a /api/news/audio con el texto
  const res = await fetch('/api/news/audio', {
    method: 'POST',
    body: JSON.stringify({ text, articleId }),
  })
  // 2. Obtener el blob de audio
  const audioBlob = await res.blob()
  // 3. Subir a Supabase Storage bucket "audio"
  const { data } = await supabase.storage
    .from('audio')
    .upload(`articles/${articleId}.wav`, audioBlob, { contentType: 'audio/wav' })
  // 4. Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('audio')
    .getPublicUrl(`articles/${articleId}.wav`)
  // 5. Actualizar la columna audio_url en news_articles
  await supabase.from('news_articles')
    .update({ audio_url: publicUrl })
    .eq('id', articleId)
  return publicUrl
}
```

2. **Crear Supabase Storage bucket** — en el dashboard de Supabase:
   - Crear bucket "audio" público
   - Policy: `SELECT` para todos, `INSERT/UPDATE` solo para service_role

3. **Modificar `api/news/audio/route.ts`:**
   - Mejorar el fallback chain: XTTS-v2 → facebook/mms-tts-spa → espeak (local)
   - Agregar un parámetro `voice` para seleccionar de múltiples voces
   - Retornar metadata con duración estimada del audio

4. **Conectar el botón "Escuchar artículo"** en `src/app/article/[id]/page.tsx`:
```typescript
const handleListenArticle = async () => {
  setAudioLoading(true)
  try {
    let audioUrl = article.audio_url
    if (!audioUrl) {
      audioUrl = await generateArticleAudio(article.id, article.enriched_content || article.content)
    }
    setAudioState({ articleId: article.id, title: article.title, audioUrl })
  } finally {
    setAudioLoading(false)
  }
}
```

5. **Crear estado global de audio** — `src/lib/stores/audio-store.ts` (usar Zustand):
```bash
npm install zustand
```
```typescript
import { create } from 'zustand'

interface AudioStore {
  isPlaying: boolean
  currentArticleId: string | null
  currentTitle: string
  currentAudioUrl: string | null
  progress: number
  duration: number
  queue: Array<{ id: string; title: string; url: string }>
  play: (articleId: string, title: string, url: string) => void
  pause: () => void
  addToQueue: (item: { id: string; title: string; url: string }) => void
  next: () => void
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  isPlaying: false,
  currentArticleId: null,
  currentTitle: '',
  currentAudioUrl: null,
  progress: 0,
  duration: 0,
  queue: [],
  play: (articleId, title, url) => set({ isPlaying: true, currentArticleId: articleId, currentTitle: title, currentAudioUrl: url }),
  pause: () => set({ isPlaying: false }),
  addToQueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
  next: () => {
    const { queue } = get()
    if (queue.length > 0) {
      const [next, ...rest] = queue
      set({ currentArticleId: next.id, currentTitle: next.title, currentAudioUrl: next.url, queue: rest, isPlaying: true })
    }
  },
}))
```

6. **Mejorar AudioPlayer** — agregar:
   - Velocidad de reproducción (0.5x, 1x, 1.25x, 1.5x, 2x)
   - Cola de reproducción (queue)
   - Mini-player collapsed y expanded
   - Waveform visual (usar `wavesurfer.js`)
   - Botón "Agregar a cola" en cada NewsCard

---

## 🤖 CHAT IA REAL CON GROK

### 9. Conectar Chat a Grok API Real

**Archivos a modificar:** `src/components/sidebar.tsx`, `src/app/article/[id]/page.tsx`, `src/app/api/chat/route.ts`

**Estado actual:** El chat usa `setTimeout` con respuestas hardcodeadas.

**Implementación:**

1. **En `sidebar.tsx` y `article/[id]/page.tsx`**, reemplazar el `setTimeout` con:
```typescript
const handleSendChat = async () => {
  if (!chatInput.trim()) return
  const userMsg = { id: Date.now().toString(), role: 'user' as const, content: chatInput, timestamp: new Date() }
  setChatMessages(prev => [...prev, userMsg])
  setChatInput('')
  setIsTyping(true)

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: chatInput,
        articleContext: article || null, // null en sidebar global
        history: chatMessages.map(m => ({ role: m.role, content: m.content })),
      }),
    })
    const data = await res.json()
    setChatMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.reply || 'Error al generar respuesta.',
      timestamp: new Date(),
    }])
  } catch {
    setChatMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Lo siento, hubo un error de conexión. Intenta de nuevo.',
      timestamp: new Date(),
    }])
  } finally {
    setIsTyping(false)
  }
}
```

2. **Mejorar el chat con streaming** — modificar `api/chat/route.ts` para usar streaming:
```typescript
export async function POST(request: NextRequest) {
  // ... setup ...
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: true, temperature: 0.7, max_tokens: 500 }),
  })

  // Stream the response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader()
      if (!reader) return controller.close()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        controller.enqueue(value)
      }
      controller.close()
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
}
```

3. **Agregar features al chat:**
   - Historial persistido en localStorage (últimas 50 conversaciones)
   - Botón "Copiar respuesta"
   - Botón "Compartir conversación"
   - Sugerencias de preguntas debajo del input (chips clickeables): "¿Es verificable?", "¿Qué opinan expertos?", "Resumen en 1 línea"
   - Markdown rendering en las respuestas (usar `react-markdown`)
   - Code blocks con syntax highlighting si Grok responde con código

---

## 🗄️ CONEXIÓN REAL A BASE DE DATOS

### 10. Conectar Supabase Completamente

**Archivos a modificar:** `src/lib/supabase.ts`, `src/app/page.tsx`, `src/app/article/[id]/page.tsx`, todas las API routes

**Estado actual:** El client de Supabase existe pero toda la data viene de `mock-data.ts`.

**Pasos:**

1. **Crear la tabla en Supabase** — ejecutar el SQL que está documentado en `src/lib/supabase.ts` (líneas 20-45)

2. **Crear un data service** — `src/lib/services/news-service.ts`:
```typescript
import { supabase } from '../supabase'
import { NewsArticle } from '../types'

export async function getLatestArticles(options: {
  category?: string
  limit?: number
  offset?: number
  isLive?: boolean
}) {
  let query = supabase
    .from('news_articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(options.limit || 20)
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1)

  if (options.category && options.category !== 'all' && options.category !== 'inicio') {
    query = query.eq('category', options.category)
  }
  if (options.isLive) {
    query = query.eq('is_live', true)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { articles: data as NewsArticle[], count }
}

export async function getArticleById(id: string) {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as NewsArticle
}

export async function searchArticles(query: string) {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .textSearch('title', query, { type: 'websearch' })
    .order('published_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data as NewsArticle[]
}
```

3. **Implementar fallback graceful** — si Supabase no está configurado, usar mock data:
```typescript
const USE_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

export async function getArticles(...) {
  if (USE_MOCK) return getMockArticlesByCategory(category)
  return getLatestArticlesFromSupabase(...)
}
```

4. **En `page.tsx`**, reemplazar el `useMemo` con mock data por un `useEffect` con fetch real:
```typescript
useEffect(() => {
  async function loadArticles() {
    setLoading(true)
    const { articles } = await getLatestArticles({ category: activeCategory, limit: 20, offset: page * 20 })
    setArticles(prev => page === 0 ? articles : [...prev, ...articles])
    setLoading(false)
  }
  loadArticles()
}, [activeCategory, page])
```

5. **Activar el cron** — en `src/app/api/cron/route.ts`, descomentar las líneas de Supabase storage (líneas 77-80) y hacer que el pipeline realmente guarde en la BD

---

## 🔍 BÚSQUEDA INTELIGENTE

### 11. Implementar Búsqueda IA

**Archivos a crear:**
- `src/app/search/page.tsx` — página de resultados
- `src/components/search-dialog.tsx` — modal de búsqueda (Cmd+K)
- `src/app/api/search/route.ts` — endpoint de búsqueda

**Implementación:**

1. **Search Dialog (Cmd+K)** — crear `src/components/search-dialog.tsx`:
   - Modal con input grande (estilo Spotlight/Raycast)
   - Debounced search (300ms) que busca en título y contenido
   - Resultados mostrados en lista con highlight del match
   - Sugerencias recientes (localStorage)
   - Filtros rápidos: categoría, fecha, solo live, solo con audio
   - Usar `Dialog` de shadcn + `Command` component (instalar: `npx shadcn@latest add command`)

2. **API endpoint** — `src/app/api/search/route.ts`:
   - Búsqueda por texto en Supabase (`textSearch` o full-text con `pg_trgm`)
   - Opción de búsqueda semántica usando embeddings (similar al dedup endpoint)
   - Integración con Grok para "búsqueda IA" que interpreta la query del usuario

3. **Atajos de teclado** — agregar en `layout.tsx`:
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setSearchOpen(true)
    }
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [])
```

---

## 📰 FEED INFINITO REAL

### 12. Implementar Infinite Scroll

**Archivo a modificar:** `src/app/page.tsx`

**Implementación:**

```bash
npm install react-intersection-observer
```

```typescript
import { useInView } from 'react-intersection-observer'

// En HomePage:
const [page, setPage] = useState(0)
const [hasMore, setHasMore] = useState(true)
const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 })

useEffect(() => {
  if (inView && hasMore && !loading) {
    setPage(prev => prev + 1)
  }
}, [inView, hasMore, loading])

// En el JSX, reemplazar el botón "Cargar más":
{hasMore && (
  <div ref={loadMoreRef} className="flex justify-center py-8">
    <Loader2 className="w-6 h-6 animate-spin text-programbi" />
  </div>
)}
```

---

## 🔔 SISTEMA DE NOTIFICACIONES

### 13. Push Notifications + In-App

**Archivos a crear:**
- `src/components/notifications/notification-bell.tsx`
- `src/components/notifications/notification-panel.tsx`
- `src/lib/stores/notification-store.ts`
- `public/sw.js` — service worker para push notifications

**Tipos de notificación:**
- 🔴 Breaking news
- 📡 Nuevo evento LIVE
- 🤖 Grok detectó tendencia relevante
- 🔖 Artículo bookmarkeado actualizado
- 📊 Resumen diario (newsletter style)

**Implementación:**
1. Badge rojo con contador en el ícono de campana del navbar
2. Panel dropdown al hacer click (lista de notificaciones con timestamp)
3. Web Push con service worker (pedir permiso al usuario)
4. Toast notifications para breaking news (usar Sonner: `npm install sonner`)

---

## 📊 FUNCIONALIDADES AVANZADAS

### 14. Dashboard de Analytics para Usuarios

**Archivos a crear:**
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/reading-chart.tsx`
- `src/components/dashboard/category-pie.tsx`

**Contenido:**
- Artículos leídos esta semana (gráfico de barras)
- Distribución por categoría (pie chart)
- Tiempo de lectura total
- Noticias más leídas globalmente
- Usar `recharts` para los gráficos: `npm install recharts`

### 15. Newsletter / Digest por Email

**Archivos a crear:**
- `src/app/api/newsletter/route.ts`
- `src/components/newsletter-form.tsx`

**Implementación:**
- Formulario de suscripción en el footer y sidebar
- Template HTML para el digest diario/semanal
- Usar `resend` para envío de emails: `npm install resend`
- El cron puede generar y enviar el digest automáticamente

### 16. Modo Debate IA

**Archivos a crear:**
- `src/components/debate-panel.tsx`
- `src/app/api/debate/route.ts`

**Concepto:** Usuario puede hacer que 2 IAs debatan sobre una noticia:
- "IA Optimista" vs "IA Pesimista"
- Cada una presenta argumentos en burbujas de chat alternadas
- El usuario puede votar qué argumento es más convincente
- Usar 2 system prompts diferentes para el mismo modelo Grok

### 17. Mapa de Noticias

**Archivos a crear:**
- `src/app/map/page.tsx`
- `src/components/news-map.tsx`

**Concepto:** Mapa interactivo mostrando noticias geolocalizadas
- Usar `react-map-gl` + Mapbox
- Clusters de noticias por país/ciudad
- Click en punto → popup con artículo
- Filtro por categoría en el mapa

### 18. Sistema de Bookmarks y Colecciones

**Archivos a crear:**
- `src/lib/stores/bookmark-store.ts`
- `src/components/bookmark-button.tsx`
- `src/app/bookmarks/page.tsx`

**Implementación:**
- Zustand store con persistencia en localStorage (offline) + sync con Supabase (online)
- El usuario puede crear "Colecciones" (como playlists de noticias)
- Icono de bookmark en cada NewsCard (toggle, con animación de llenado)
- Página `/bookmarks` con grid de artículos guardados, filtrable por colección

### 19. Compartir Artículos

**Archivos a crear:**
- `src/components/share-dialog.tsx`

**Implementación:**
- Usar `navigator.share()` para mobile nativo
- Fallback con dialog para desktop: copiar link, compartir en Twitter/LinkedIn/WhatsApp
- Generar imagen OG dinámica para cada artículo: `src/app/api/og/route.tsx` con `@vercel/og`
- Card preview bonita cuando se comparte en redes sociales

### 20. Comentarios en Artículos

**Archivos a crear:**
- `src/components/comments-section.tsx`
- `src/app/api/comments/route.ts`

**SQL:**
```sql
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES news_articles(id),
  user_id UUID REFERENCES auth.users,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id), -- para replies anidados
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🛡️ PRODUCCIÓN Y CALIDAD

### 21. Error Boundaries

**Archivos a crear:**
- `src/components/error-boundary.tsx`
- `src/app/error.tsx` (Next.js error page)
- `src/app/not-found.tsx` (404 page)

```typescript
// src/app/error.tsx
'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <button onClick={reset} className="px-6 py-2 bg-programbi text-white rounded-full">
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
```

### 22. Rate Limiting

**Archivo a crear:** `src/lib/rate-limit.ts`

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests per minute
})
```

Agregar al inicio de cada API route:
```typescript
const ip = request.headers.get('x-forwarded-for') || 'anonymous'
const { success } = await rateLimiter.limit(ip)
if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
```

### 23. Tests

**Archivos a crear:**
- `__tests__/components/news-card.test.tsx`
- `__tests__/api/fetch.test.ts`
- `__tests__/lib/utils.test.ts`
- `cypress/e2e/homepage.cy.ts`
- `jest.config.ts`

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom ts-jest cypress
```

### 24. PWA Completa

**Archivos a crear/modificar:**
- `public/sw.js` — service worker con cache strategies
- `src/app/layout.tsx` — registrar el SW
- Generar iconos de 192x192 y 512x512 (usar el SVG del logo)

```javascript
// public/sw.js
const CACHE_NAME = 'newsbi-v1'
const urlsToCache = ['/', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)))
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  )
})
```

### 25. SEO Dinámico por Artículo

**Archivo a modificar:** `src/app/article/[id]/page.tsx`

**Problema actual:** La página de artículo es `"use client"`, por lo que no genera metadata dinámica.

**Solución:** Separar en:
1. `src/app/article/[id]/page.tsx` (Server Component) — genera metadata + pasa data al client
2. `src/components/article-content.tsx` (Client Component) — toda la UI interactiva

```typescript
// src/app/article/[id]/page.tsx (Server Component)
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const article = await getArticleById(params.id) // fetch desde Supabase
  return {
    title: `${article.title} | NewsBI Pulse`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      images: [article.image_url || '/og-default.png'],
    },
  }
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticleById(params.id)
  return <ArticleContent article={article} />
}
```

### 26. OG Image Dinámico

**Archivo a crear:** `src/app/api/og/route.tsx`

```bash
npm install @vercel/og
```

```typescript
import { ImageResponse } from '@vercel/og'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'NewsBI Pulse'
  const category = searchParams.get('category') || 'Tech'

  return new ImageResponse(
    (
      <div style={{ display: 'flex', background: 'linear-gradient(135deg, #0F172A, #00A1FF)', width: '100%', height: '100%', padding: 60, flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ color: '#22D3EE', fontSize: 24, marginBottom: 16 }}>{category.toUpperCase()}</div>
        <div style={{ color: 'white', fontSize: 52, fontWeight: 800, lineHeight: 1.2 }}>{title}</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20, marginTop: 24 }}>NewsBI Pulse • Noticias IA en tiempo real</div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
```

---

## 📦 DEPENDENCIAS A INSTALAR

```bash
# Auth
npm install @supabase/auth-helpers-nextjs @supabase/ssr

# Estado global
npm install zustand

# Scroll infinito
npm install react-intersection-observer

# Markdown en chat
npm install react-markdown remark-gfm

# Toast notifications
npm install sonner

# Charts (dashboard)
npm install recharts

# Rate limiting
npm install @upstash/ratelimit @upstash/redis

# OG images
npm install @vercel/og

# Email
npm install resend

# Audio waveform
npm install wavesurfer.js

# Mapa (opcional)
npm install react-map-gl mapbox-gl

# Testing
npm install -D jest @testing-library/react @testing-library/jest-dom ts-jest cypress

# Search (Cmd+K)
npx shadcn@latest add command
```

---

## 🎯 ORDEN DE PRIORIDAD RECOMENDADO

| # | Feature | Impacto | Dificultad | Tiempo Est. |
|---|---------|---------|------------|-------------|
| 1 | Conectar Supabase real + reemplazar mocks | 🔴 Crítico | Media | 2-3h |
| 2 | Chat IA real con Grok (streaming) | 🔴 Crítico | Media | 1-2h |
| 3 | Audio real (generar + storage + playback) | 🔴 Crítico | Alta | 3-4h |
| 4 | Feed infinito con paginación | 🟡 Alto | Baja | 1h |
| 5 | Búsqueda (Cmd+K + API) | 🟡 Alto | Media | 2-3h |
| 6 | Autenticación + cuentas | 🟡 Alto | Alta | 4-5h |
| 7 | Fix modo Light completo | 🟡 Alto | Baja | 1-2h |
| 8 | Error boundaries + 404 + error pages | 🟢 Medio | Baja | 30min |
| 9 | SEO dinámico por artículo | 🟢 Medio | Media | 1-2h |
| 10 | Bookmarks + colecciones | 🟢 Medio | Media | 2-3h |
| 11 | Notificaciones push | 🟢 Medio | Alta | 3-4h |
| 12 | Dashboard analytics | 🔵 Nice | Media | 2-3h |
| 13 | Comentarios | 🔵 Nice | Media | 2-3h |
| 14 | Newsletter | 🔵 Nice | Media | 2h |
| 15 | Debate IA | 🔵 Nice | Media | 2h |
| 16 | Mapa de noticias | 🔵 Nice | Alta | 4-5h |
| 17 | PWA completa | 🔵 Nice | Media | 2h |
| 18 | Tests | 🔵 Nice | Media | 3-4h |
| 19 | Rate limiting | 🔵 Nice | Baja | 30min |
| 20 | Micro-animaciones premium | 🔵 Nice | Media | 2-3h |

---

## 📁 ESTRUCTURA DE ARCHIVOS OBJETIVO

```
src/
├── app/
│   ├── api/
│   │   ├── auth/callback/route.ts         [NUEVO]
│   │   ├── chat/route.ts                  [MODIFICAR - streaming]
│   │   ├── comments/route.ts              [NUEVO]
│   │   ├── cron/route.ts                  [MODIFICAR - Supabase real]
│   │   ├── debate/route.ts                [NUEVO]
│   │   ├── news/
│   │   │   ├── audio/route.ts             [MODIFICAR - storage]
│   │   │   ├── deduplicate/route.ts       ✅
│   │   │   ├── enrich/route.ts            ✅
│   │   │   ├── fetch/route.ts             ✅
│   │   │   └── live/route.ts              ✅
│   │   ├── newsletter/route.ts            [NUEVO]
│   │   ├── og/route.tsx                   [NUEVO]
│   │   └── search/route.ts               [NUEVO]
│   ├── article/[id]/page.tsx              [MODIFICAR - server + metadata]
│   ├── bookmarks/page.tsx                 [NUEVO]
│   ├── dashboard/page.tsx                 [NUEVO]
│   ├── error.tsx                          [NUEVO]
│   ├── globals.css                        [MODIFICAR - light mode fix]
│   ├── layout.tsx                         [MODIFICAR - SW + keyboard]
│   ├── map/page.tsx                       [NUEVO]
│   ├── not-found.tsx                      [NUEVO]
│   ├── page.tsx                           [MODIFICAR - infinite scroll]
│   ├── profile/
│   │   ├── bookmarks/page.tsx             [NUEVO]
│   │   ├── history/page.tsx               [NUEVO]
│   │   ├── page.tsx                       [NUEVO]
│   │   └── settings/page.tsx              [NUEVO]
│   └── search/page.tsx                    [NUEVO]
├── components/
│   ├── article-content.tsx                [NUEVO]
│   ├── audio-player.tsx                   [MODIFICAR - queue + speed]
│   ├── auth/
│   │   ├── login-dialog.tsx               [NUEVO]
│   │   ├── register-dialog.tsx            [NUEVO]
│   │   └── user-menu.tsx                  [NUEVO]
│   ├── bookmark-button.tsx                [NUEVO]
│   ├── category-filter.tsx                ✅
│   ├── comments-section.tsx               [NUEVO]
│   ├── dashboard/
│   │   ├── category-pie.tsx               [NUEVO]
│   │   └── reading-chart.tsx              [NUEVO]
│   ├── debate-panel.tsx                   [NUEVO]
│   ├── error-boundary.tsx                 [NUEVO]
│   ├── footer.tsx                         [MODIFICAR - newsletter form]
│   ├── hero-section.tsx                   ✅
│   ├── live-ticker.tsx                    [MODIFICAR - real data]
│   ├── logo.tsx                           ✅
│   ├── navbar.tsx                         [MODIFICAR - search + auth + notifs]
│   ├── news-card.tsx                      [MODIFICAR - bookmark + share]
│   ├── news-map.tsx                       [NUEVO]
│   ├── newsletter-form.tsx                [NUEVO]
│   ├── notifications/
│   │   ├── notification-bell.tsx          [NUEVO]
│   │   └── notification-panel.tsx         [NUEVO]
│   ├── search-dialog.tsx                  [NUEVO]
│   ├── share-dialog.tsx                   [NUEVO]
│   ├── sidebar.tsx                        [MODIFICAR - real Grok]
│   ├── skeletons.tsx                      ✅
│   ├── theme-provider.tsx                 ✅
│   └── ui/                               ✅ (shadcn)
├── lib/
│   ├── auth.ts                            [NUEVO]
│   ├── mock-data.ts                       ✅ (mantener como fallback)
│   ├── rate-limit.ts                      [NUEVO]
│   ├── services/
│   │   ├── audio-service.ts               [NUEVO]
│   │   └── news-service.ts               [NUEVO]
│   ├── stores/
│   │   ├── audio-store.ts                 [NUEVO]
│   │   ├── bookmark-store.ts              [NUEVO]
│   │   └── notification-store.ts          [NUEVO]
│   ├── supabase.ts                        [MODIFICAR - auth helpers]
│   ├── types.ts                           [MODIFICAR - nuevos types]
│   └── utils.ts                           ✅
├── middleware.ts                           [NUEVO]
├── __tests__/                             [NUEVO]
└── public/
    ├── sw.js                              [NUEVO]
    ├── icon-192.png                       [NUEVO - generar]
    ├── icon-512.png                       [NUEVO - generar]
    └── manifest.json                      ✅
```

---

> **Nota final:** Este proyecto ya tiene una base sólida de UI/UX y arquitectura. La prioridad #1 es reemplazar todo el mock data con conexiones reales (Supabase + APIs). Una vez que los datos fluyan realmente, el 80% de las features se activan automáticamente porque la infraestructura de API routes ya existe.

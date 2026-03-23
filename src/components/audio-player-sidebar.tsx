"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Loader2,
  Headphones,
  BookOpen,
  FileText,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Pin,
  PinOff,
  GripHorizontal,
  Music2,
  Radio,
} from "lucide-react";
import { useAudioPlayerStore, AudioTrack } from "@/lib/stores/audio-player-store";
import { createClient } from "@/lib/supabase/client";

export function AudioPlayerSidebar() {
  const store = useAudioPlayerStore();
  const {
    mode,
    setMode,
    tracks,
    setTracks,
    activeCategory,
    setActiveCategory,
    readMode,
    toggleReadMode,
    currentIndex,
    isPlaying,
    playbackRate,
    progress,
    duration,
    currentTime,
    volume,
    play,
    pause,
    togglePlay,
    next,
    prev,
    setPlaybackRate,
    setProgress,
    setDuration,
    setCurrentTime,
    setVolume,
    setTrackAudioUrl,
    setTrackLoading,
    pinnedWidth,
    setPinnedWidth,
  } = store;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();
  const pathname = usePathname();

  // ── Category detect from URL ──
  useEffect(() => {
    if (mode === "closed") return;
    const path = pathname.toLowerCase();
    const map: Record<string, string> = {
      "/chile": "chile", "/finanzas": "business", "/tech": "tech",
      "/tecnologia": "tech", "/politica": "politics", "/deportes": "sports",
      "/ciencia": "science", "/salud": "health", "/mundo": "world",
    };
    for (const [route, cat] of Object.entries(map)) {
      if (path.startsWith(route)) { setActiveCategory(cat); return; }
    }
    setActiveCategory("all");
  }, [mode, pathname]);

  // ── Fetch tracks ──
  useEffect(() => {
    if (mode === "closed" || tracks.length > 0) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("news_articles")
          .select("id, title, summary, category, image_url, slug")
          .order("published_at", { ascending: false })
          .limit(15);

        if (error) {
          console.error("[AudioPlayer] Supabase error:", error);
          return;
        }
        if (data && data.length > 0) {
          setTracks(data.map((a: any) => ({
            id: a.id, title: a.title, summary: a.summary || "",
            category: a.category || "general",
            image_url: a.image_url, slug: a.slug,
          })));
        }
      } catch (err) {
        console.error("[AudioPlayer] Fetch error:", err);
      }
    })();
  }, [mode]);

  // ── Filtered tracks ──
  const filteredTracks = useMemo(() => {
    if (activeCategory === "all") return tracks;
    return tracks.filter((t) => t.category.toLowerCase() === activeCategory.toLowerCase());
  }, [tracks, activeCategory]);

  const currentTrack = filteredTracks[currentIndex];

  const categories = useMemo(() => {
    const cats = new Set(tracks.map((t) => t.category.toLowerCase()));
    return ["all", ...Array.from(cats)];
  }, [tracks]);

  // ── Click outside to close (overlay mode) ──
  useEffect(() => {
    if (mode !== "full") return;
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        // If the user has started playing something, minimize instead of closing completely
        const hasEngaged = isPlaying || currentTime > 0 || progress > 0;
        setMode(hasEngaged ? "mini" : "closed");
      }
    };
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 200);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handler); };
  }, [mode, isPlaying, currentTime, progress]);

  // ── TTS with 24h smart cache ──
  const getCachedAudio = useCallback((trackId: string): string | null => {
    try {
      const cached = localStorage.getItem(`tts_${trackId}`);
      if (!cached) return null;
      const { timestamp } = JSON.parse(cached);
      // Expire after 24 hours
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(`tts_${trackId}`);
        return null;
      }
      // Refresh timestamp on access (listened = stays cached)
      localStorage.setItem(`tts_${trackId}`, JSON.stringify({ timestamp: Date.now() }));
      return null; // We can't persist blob URLs, but we mark it as "recently used"
    } catch { return null; }
  }, []);

  const generateAudio = useCallback(async (track: AudioTrack) => {
    if (track.audioUrl || track.isLoading) return track.audioUrl;
    setTrackLoading(track.id, true);
    try {
      const text = track.summary || track.title;
      const res = await fetch("/api/tts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: readMode }),
      });
      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setTrackAudioUrl(track.id, url);
      // Mark as listened in localStorage for cache management
      try {
        localStorage.setItem(`tts_${track.id}`, JSON.stringify({ timestamp: Date.now() }));
      } catch {}
      return url;
    } catch (err) {
      console.error("[AudioPlayer] TTS error:", err);
      setTrackLoading(track.id, false);
      return null;
    }
  }, [readMode, setTrackAudioUrl, setTrackLoading]);

  // ── Playback ──
  useEffect(() => {
    if (!currentTrack || !isPlaying) { audioRef.current?.pause(); return; }
    (async () => {
      const url = currentTrack.audioUrl || (await generateAudio(currentTrack));
      if (url && audioRef.current) {
        if (audioRef.current.src !== url) audioRef.current.src = url;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.volume = volume;
        try { await audioRef.current.play(); } catch {}
      }
    })();
  }, [currentIndex, isPlaying, currentTrack?.audioUrl]);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackRate; }, [playbackRate]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (audioRef.current.duration) setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
  };
  const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
  const handleEnded = () => next();

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (audioRef.current?.duration) audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioRef.current.duration;
  };

  const fmt = (s: number) => (!s || isNaN(s)) ? "0:00" : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const speeds = [0.75, 1, 1.25, 1.5, 2];

  const categoryLabels: Record<string, string> = {
    all: "🎵 Todo", chile: "🇨🇱 Chile", tech: "💻 Tech", politics: "🏛️ Política",
    business: "💰 Finanzas", world: "🌍 Mundo", sports: "⚽ Deportes",
    science: "🔬 Ciencia", health: "🩺 Salud", entertainment: "🎬 Entretención", general: "📰 General",
  };

  // ── RENDERERS ──

  // Mini Player (draggable floating bar)
  const renderMiniPlayer = () => (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 80 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[440px] max-w-[calc(100vw-2rem)]"
    >
      <div className="relative rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.5)] p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing">
        {/* Drag handle strip */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/10" />

        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0">
          {currentTrack?.image_url ? (
            <img src={currentTrack.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Music2 className="w-5 h-5 text-white/10" /></div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-white/90 truncate">{currentTrack?.title || "Sin selección"}</p>
          <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#1890FF] to-[#22D3EE] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-white/25 mt-0.5 font-mono">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={prev} className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60">
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
            {currentTrack?.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button onClick={next} className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60">
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expand / Close */}
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={() => setMode("full")} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-white/30 hover:text-white/60">
            <Maximize2 className="w-3 h-3" />
          </button>
          <button onClick={() => setMode("closed")} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-white/30 hover:text-white/60">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Full / Pinned sidebar
  const renderFullSidebar = () => {
    const isPinned = mode === "pinned";
    const width = isPinned ? pinnedWidth : 380;

    return (
      <>
        {/* Overlay for full mode, no overlay for pinned */}
        {!isPinned && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden"
            onClick={() => {
              const hasEngaged = isPlaying || currentTime > 0 || progress > 0;
              setMode(hasEngaged ? "mini" : "closed");
            }}
          />
        )}

        <motion.aside
          ref={sidebarRef}
          initial={{ x: "100%", opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.8 }}
          transition={{ type: "spring", damping: 32, stiffness: 350 }}
          style={{ width }}
          className={`fixed top-0 right-0 h-full z-[70] flex flex-col overflow-hidden
            ${isPinned
              ? "bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-white/5"
              : "bg-white/20 dark:bg-black/30 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.2)]"
            }`}
        >
          {/* Frosted glass inner overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent dark:from-white/[0.02] pointer-events-none" />

          {/* ── Header ── */}
          <div className="relative z-10 px-5 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#1890FF]/80 to-[#22D3EE]/80 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-[#1890FF]/20">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-foreground">NewsBI Radio</h2>
                  <p className="text-[10px] text-muted-foreground/60">Tu podcast de noticias IA</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMode("mini")}
                  className="w-7 h-7 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors text-muted-foreground/40 hover:text-foreground"
                  title="Minimizar"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setMode(isPinned ? "full" : "pinned")}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                    isPinned
                      ? "bg-[#1890FF]/10 text-[#1890FF]"
                      : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground/40 hover:text-foreground"
                  }`}
                  title={isPinned ? "Desfijar" : "Fijar"}
                >
                  {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setMode("closed")}
                  className="w-7 h-7 rounded-xl hover:bg-red-500/10 flex items-center justify-center transition-colors text-muted-foreground/40 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5 mt-4 overflow-x-auto hide-scrollbar pb-0.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-2xl text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 border ${
                    activeCategory === cat
                      ? "bg-[#1890FF]/10 text-[#1890FF] border-[#1890FF]/20 shadow-sm"
                      : "bg-transparent text-muted-foreground/50 border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Now Playing ── */}
          {currentTrack ? (
            <div className="relative z-10 px-5 pb-4">
              {/* Album art */}
              <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden mb-4 shadow-lg">
                {currentTrack.image_url ? (
                  <img src={currentTrack.image_url} alt={currentTrack.title}
                    className={`w-full h-full object-cover transition-transform duration-[2000ms] ${isPlaying ? "scale-110" : "scale-100"}`}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1890FF]/20 to-[#22D3EE]/10 flex items-center justify-center">
                    <Music2 className="w-14 h-14 text-foreground/5" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Category chip */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-white/15 backdrop-blur-lg text-[9px] font-bold uppercase tracking-widest text-white rounded-xl border border-white/10">
                    {currentTrack.category}
                  </span>
                </div>

                {/* Equalizer */}
                {isPlaying && (
                  <div className="absolute bottom-3 right-3 flex items-end gap-[3px] h-5">
                    {[1,2,3,4,5].map(i => (
                      <motion.div key={i} className="w-[3px] bg-white/80 rounded-full"
                        animate={{ height: ["25%", `${40+Math.random()*60}%`, "15%", `${50+Math.random()*50}%`] }}
                        transition={{ duration: 0.7+i*0.12, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                )}

                {/* Title on art */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-bold text-[14px] leading-tight line-clamp-2 text-white drop-shadow-md">
                    {currentTrack.title}
                  </h3>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-2">
                <div className="w-full h-[5px] bg-foreground/5 rounded-full cursor-pointer group overflow-hidden" onClick={handleSeek}>
                  <div className="h-full rounded-full bg-gradient-to-r from-[#1890FF] to-[#22D3EE] transition-all relative" style={{ width: `${progress}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#1890FF] rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -mr-1.5 border-2 border-white dark:border-slate-900" />
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground/40 font-mono">
                  <span>{fmt(currentTime)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-5 mb-3">
                <button onClick={prev} disabled={currentIndex === 0}
                  className="w-10 h-10 rounded-2xl hover:bg-foreground/5 flex items-center justify-center transition-all disabled:opacity-20 text-foreground/60">
                  <SkipBack className="w-5 h-5" />
                </button>

                <button onClick={togglePlay}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90
                    bg-gradient-to-br from-[#1890FF] to-[#22D3EE] text-white
                    shadow-[0_4px_30px_rgba(24,144,255,0.35)] hover:shadow-[0_4px_40px_rgba(24,144,255,0.5)]">
                  {currentTrack.isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>

                <button onClick={next} disabled={currentIndex >= filteredTracks.length - 1}
                  className="w-10 h-10 rounded-2xl hover:bg-foreground/5 flex items-center justify-center transition-all disabled:opacity-20 text-foreground/60">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Speed + Options */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {speeds.map(s => (
                    <button key={s} onClick={() => setPlaybackRate(s)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-xl transition-all ${
                        playbackRate === s ? "bg-[#1890FF]/10 text-[#1890FF]" : "text-muted-foreground/30 hover:text-foreground/60"
                      }`}>{s}x</button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setVolume(volume === 0 ? 1 : 0)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground/30 hover:text-foreground/60 transition-colors">
                    {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={toggleReadMode}
                    className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold transition-all ${
                      readMode === "full" ? "bg-[#1890FF]/10 text-[#1890FF]" : "text-muted-foreground/30 hover:text-foreground/60"
                    }`}>
                    {readMode === "full" ? <BookOpen className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    {readMode === "full" ? "Completo" : "Resumen"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 px-5 py-8 text-center">
              <div className="w-14 h-14 rounded-3xl bg-foreground/[0.03] flex items-center justify-center mx-auto mb-3">
                <Music2 className="w-7 h-7 text-foreground/10" />
              </div>
              <p className="text-sm text-muted-foreground/40">Selecciona una noticia</p>
            </div>
          )}

          {/* ── Playlist ── */}
          <div className="flex-1 overflow-y-auto hide-scrollbar border-t border-foreground/5 relative z-10">
            <div className="px-5 py-3">
              <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground/30 uppercase">
                En Cola • {filteredTracks.length}
              </h4>
            </div>
            <div className="px-3 pb-6 space-y-0.5">
              {filteredTracks.map((track, i) => {
                const active = i === currentIndex;
                return (
                  <button key={track.id} onClick={() => play(i)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left group ${
                      active ? "bg-[#1890FF]/8" : "hover:bg-foreground/[0.03]"
                    }`}>
                    {/* Number */}
                    <div className="w-5 text-center shrink-0">
                      {active && isPlaying ? (
                        <div className="flex items-end justify-center gap-[2px] h-3.5">
                          {[1,2,3].map(b => (
                            <motion.div key={b} className="w-[2px] bg-[#1890FF] rounded-full"
                              animate={{ height: ["20%", `${60+Math.random()*40}%`, "25%"] }}
                              transition={{ duration: 0.5+b*0.1, repeat: Infinity }} />
                          ))}
                        </div>
                      ) : (
                        <span className={`text-[11px] font-mono ${active ? "text-[#1890FF]" : "text-muted-foreground/20"}`}>{i+1}</span>
                      )}
                    </div>

                    {/* Thumb */}
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-foreground/[0.03] shrink-0">
                      {track.image_url ? (
                        <img src={track.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music2 className="w-4 h-4 text-foreground/5" /></div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold line-clamp-2 leading-tight ${active ? "text-[#1890FF]" : "text-foreground/70 group-hover:text-foreground/90"}`}>
                        {track.title}
                      </p>
                      <p className="text-[9px] text-muted-foreground/30 mt-0.5 uppercase tracking-wider">{track.category}</p>
                    </div>

                    {track.isLoading && <Loader2 className="w-3.5 h-3.5 text-[#1890FF] animate-spin shrink-0" />}
                  </button>
                );
              })}

              {filteredTracks.length === 0 && (
                <div className="text-center py-10">
                  <Headphones className="w-8 h-8 mx-auto mb-2 text-foreground/5" />
                  <p className="text-xs text-muted-foreground/30">{tracks.length === 0 ? "Cargando..." : "Sin noticias en esta sección"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Resize handle for pinned mode */}
          {isPinned && (
            <div
              className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[#1890FF]/20 transition-colors group"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startW = pinnedWidth;
                const onMove = (ev: MouseEvent) => setPinnedWidth(startW - (ev.clientX - startX));
                const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
                document.addEventListener("mousemove", onMove);
                document.addEventListener("mouseup", onUp);
              }}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full bg-foreground/5 group-hover:bg-[#1890FF]/30 transition-colors" />
            </div>
          )}
        </motion.aside>
      </>
    );
  };

  return (
    <>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} preload="metadata" />
      <AnimatePresence mode="wait">
        {(mode === "full" || mode === "pinned") && renderFullSidebar()}
        {mode === "mini" && renderMiniPlayer()}
      </AnimatePresence>
    </>
  );
}

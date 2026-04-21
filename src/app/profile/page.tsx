"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  User,
  Bookmark,
  Settings,
  Clock,
  BarChart3,
  ChevronRight,
  LogOut,
  Newspaper,
  Globe,
  Bell,
  Moon,
  Sun,
  Type,
  Image as ImageIcon,
  LayoutGrid,
  Eye,
  Crown,
  Gem,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useBookmarkStore } from "@/lib/stores/bookmark-store";
import { usePersonalizationStore } from "@/lib/stores/personalization-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_ARTICLES } from "@/lib/mock-data";
import { NewsCard } from "@/components/news-card";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";

type UserStats = {
  diamondBalance: number;
  totalBets: number;
  totalWins: number;
  totalShares: number;
};

type BetActivity = {
  id: string;
  prediction_id: string;
  side: string;
  amount: number;
  shares: number;
  created_at: string;
  prediction_title?: string;
};

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const bookmarks = useBookmarkStore((s) => s.bookmarkedArticleIds);
  const [activeTab, setActiveTab] = useState<"guardados" | "actividad" | "preferencias">("guardados");
  const { theme, setTheme } = useTheme();
  const {
    fontSize, setFontSize,
    imageRadius, setImageRadius,
    contentDensity, setContentDensity,
    showImages, setShowImages,
  } = usePersonalizationStore();
  const supabase = createClient();

  const [stats, setStats] = useState<UserStats>({ diamondBalance: 0, totalBets: 0, totalWins: 0, totalShares: 0 });
  const [recentActivity, setRecentActivity] = useState<BetActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const bookmarkedArticles = MOCK_ARTICLES.filter((a) =>
    bookmarks.includes(a.id)
  );

  // Fetch real stats from Supabase
  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      setLoadingStats(true);

      // Diamond balance
      const { data: diamonds } = await supabase
        .from("user_diamonds")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      // All bets (including sells as negative)
      const { data: bets } = await supabase
        .from("user_bets")
        .select("id, prediction_id, side, amount, shares, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const positiveBets = (bets || []).filter(b => Number(b.shares) > 0);
      const totalShares = (bets || []).reduce((sum, b) => sum + Number(b.shares || 0), 0);

      // Try to get prediction titles for recent activity
      const recentBets = (bets || []).slice(0, 10);
      const predictionIds = [...new Set(recentBets.map(b => b.prediction_id))];
      
      let predictionMap: Record<string, string> = {};
      if (predictionIds.length > 0) {
        const { data: predictions } = await supabase
          .from("predictions")
          .select("id, title")
          .in("id", predictionIds);
        
        (predictions || []).forEach(p => {
          predictionMap[p.id] = p.title;
        });
      }

      const activityWithTitles = recentBets.map(b => ({
        ...b,
        prediction_title: predictionMap[b.prediction_id] || "Mercado desconocido",
      }));

      setStats({
        diamondBalance: Number(diamonds?.balance || 0),
        totalBets: positiveBets.length,
        totalWins: 0,
        totalShares: Math.max(0, Number(totalShares.toFixed(2))),
      });
      setRecentActivity(activityWithTitles);
      setLoadingStats(false);
    }

    fetchStats();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="pt-[9rem] md:pt-[10rem]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <User className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h1 className="font-editorial text-2xl font-bold mb-2">
            Inicia sesión
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Necesitas una cuenta para ver tu perfil, artículos guardados y preferencias.
          </p>
          <Link href="/">
            <Button className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl h-11 px-6">
              Volver al inicio
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: "guardados" as const, label: "Guardados", icon: Bookmark, count: bookmarks.length },
    { id: "actividad" as const, label: "Actividad", icon: Activity, count: recentActivity.length },
    { id: "preferencias" as const, label: "Preferencias", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-[7rem] md:pt-[9rem]" />

      <div className="max-w-[900px] mx-auto px-4 pb-16">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-10"
        >
          {/* Banner */}
          <div className="h-32 md:h-40 rounded-2xl bg-gradient-to-br from-[#0052CC] via-[#0066FF] to-[#22D3EE] overflow-hidden relative">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          {/* Avatar + Info */}
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-10 md:-mt-12 px-6">
            <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-background shadow-xl">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-2xl font-bold bg-accent text-white">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="font-editorial text-2xl md:text-3xl font-bold">
                  {user.name}
                </h1>
                <span className="px-2.5 py-0.5 bg-secondary/60 border border-border text-[10px] font-bold uppercase tracking-wider rounded-full text-muted-foreground">
                  Free
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/suscripcion">
                <Button className="gap-2 rounded-xl text-xs font-semibold h-9 bg-gradient-to-r from-[#0052CC] to-[#0066FF] hover:from-[#0052CC]/90 hover:to-[#0066FF]/90 text-white shadow-sm">
                  <Crown className="w-3.5 h-3.5" />
                  Upgrade a Pro
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="gap-2 rounded-xl text-xs font-semibold border-border h-9"
              >
                <LogOut className="w-3.5 h-3.5" />
                Salir
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Mis Predicciones", href: "/mis-predicciones", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Mis Diamantes", href: "/mis-diamantes", icon: Gem, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Recompensas", href: "/recompensas", icon: Crown, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Suscripción", href: "/suscripcion", icon: Newspaper, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          ].map((action) => (
            <Link key={action.label} href={action.href}>
              <div className="bg-card border border-border rounded-xl p-4 hover:border-accent/30 hover:shadow-sm transition-all group cursor-pointer">
                <div className={`w-9 h-9 ${action.bg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-4.5 h-4.5 ${action.color}`} />
                </div>
                <p className="text-xs font-semibold group-hover:text-accent transition-colors flex items-center gap-1">
                  {action.label}
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "Diamantes", value: loadingStats ? "..." : stats.diamondBalance.toLocaleString(), icon: Gem, color: "text-amber-500" },
            { label: "Apuestas", value: loadingStats ? "..." : stats.totalBets, icon: TrendingUp, color: "text-blue-500" },
            { label: "Shares activas", value: loadingStats ? "..." : stats.totalShares, icon: BarChart3, color: "text-emerald-500" },
            { label: "Guardados", value: bookmarks.length, icon: Bookmark, color: "text-purple-500" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-4 text-center"
            >
              <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-2`} />
              <p className="font-editorial text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded-full">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="profile-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "guardados" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {bookmarkedArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {bookmarkedArticles.map((article, i) => (
                  <div key={article.id} className="editorial-rule pb-6">
                    <NewsCard article={article} index={i} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Bookmark className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="font-editorial text-lg font-bold mb-2">
                  Sin artículos guardados
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                  Guarda artículos presionando el ícono de marcador en cualquier noticia.
                </p>
                <Link href="/">
                  <Button variant="outline" className="gap-2 rounded-xl">
                    <Newspaper className="w-4 h-4" />
                    Explorar noticias
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "actividad" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((act, i) => {
                  const isSell = Number(act.shares) < 0;
                  const absAmount = Math.abs(Number(act.amount));
                  const absShares = Math.abs(Number(act.shares));
                  const date = new Date(act.created_at);
                  const timeAgo = getTimeAgo(date);

                  return (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:border-accent/20 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSell ? "bg-rose-500/10" : "bg-emerald-500/10"
                      }`}>
                        {isSell ? (
                          <ArrowDownRight className="w-4 h-4 text-rose-500" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {isSell ? "Vendió" : "Apostó"} {absAmount.toFixed(2)} 💎 → {absShares.toFixed(2)} shares
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {act.prediction_title} · Lado {act.side.toUpperCase()}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo}</span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Activity className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="font-editorial text-lg font-bold mb-2">
                  Sin actividad reciente
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                  Tu historial de apuestas y ventas aparecerá aquí.
                </p>
                <Link href="/predicciones">
                  <Button variant="outline" className="gap-2 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                    Explorar predicciones
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "preferencias" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Theme */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Apariencia</h3>
              <div className="flex gap-3">
                {[
                  { id: "light", icon: Sun, label: "Claro" },
                  { id: "dark", icon: Moon, label: "Oscuro" },
                  { id: "system", icon: Settings, label: "Sistema" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-all ${
                      theme === opt.id
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border bg-secondary/30 text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
                <Type className="w-4 h-4 text-accent" />
                Tamaño de Texto
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Ajusta el tamaño de los textos en toda la plataforma.</p>
              <div className="flex gap-3">
                {([
                  { id: "small" as const, label: "Pequeño", sample: "Aa", size: "text-sm" },
                  { id: "medium" as const, label: "Mediano", sample: "Aa", size: "text-base" },
                  { id: "large" as const, label: "Grande", sample: "Aa", size: "text-lg" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFontSize(opt.id)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                      fontSize === opt.id
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border bg-secondary/30 text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <span className={`${opt.size} font-editorial font-bold`}>{opt.sample}</span>
                    <span className="text-[10px] font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Border Radius */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
                <ImageIcon className="w-4 h-4 text-accent" />
                Esquinas de Imágenes
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Elige cómo se ven las esquinas de las imágenes.</p>
              <div className="flex gap-3">
                {([
                  { id: "none" as const, label: "Rectas", radius: "rounded-none" },
                  { id: "small" as const, label: "Sutil", radius: "rounded" },
                  { id: "medium" as const, label: "Medio", radius: "rounded-xl" },
                  { id: "large" as const, label: "Redondo", radius: "rounded-2xl" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setImageRadius(opt.id)}
                    className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all ${
                      imageRadius === opt.id
                        ? "border-accent bg-accent/5"
                        : "border-border bg-secondary/30 hover:border-border/80"
                    }`}
                  >
                    <div className={`w-10 h-8 bg-accent/20 border border-accent/30 ${opt.radius}`} />
                    <span className={`text-[10px] font-medium ${imageRadius === opt.id ? "text-accent" : "text-muted-foreground"}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Density */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
                <LayoutGrid className="w-4 h-4 text-accent" />
                Densidad del Contenido
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Controla el espacio entre elementos.</p>
              <div className="flex gap-3">
                {([
                  { id: "compact" as const, label: "Compacto", icon: "⊞" },
                  { id: "comfortable" as const, label: "Normal", icon: "⊡" },
                  { id: "spacious" as const, label: "Amplio", icon: "⬜" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setContentDensity(opt.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-all ${
                      contentDensity === opt.id
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border bg-secondary/30 text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <span className="text-base">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Show Images Toggle */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4 text-accent" />
                    Mostrar Imágenes
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Desactiva para una lectura más rápida.
                  </p>
                </div>
                <button
                  onClick={() => setShowImages(!showImages)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    showImages ? "bg-accent" : "bg-secondary"
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    showImages ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-accent" />
                    Notificaciones
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recibe alertas de noticias de última hora.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-secondary/60 px-2 py-1 rounded-full uppercase tracking-wider">
                  Pronto
                </span>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-accent" />
                Categorías Favoritas
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Tecnología", "Negocios", "Chile", "IA", "Ciencia", "Política"].map(
                  (cat) => (
                    <button
                      key={cat}
                      className="px-3.5 py-1.5 border border-border rounded-full text-[12px] font-medium hover:border-accent hover:text-accent transition-colors"
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}

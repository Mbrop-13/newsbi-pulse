"use client";

import { useState, useEffect } from "react";
import { Bell, MoreHorizontal, Inbox, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, BellRing, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function getNotificationIcon(type: string, title: string, message: string) {
  const isLoss = title.includes("Caída") || title.includes("variación") || message.includes("cayó") || message.includes("bajó");
  
  if (type === "portfolio_pnl") {
    if (isLoss) {
      return (
        <div className="w-8 h-8 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
          <TrendingDown className="w-4 h-4 stroke-[2]" />
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 stroke-[2]" />
        </div>
      );
    }
  }

  if (type === "asset_pnl") {
    if (isLoss) {
      return (
        <div className="w-8 h-8 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
          <ArrowDownRight className="w-4 h-4 stroke-[2]" />
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-4 h-4 stroke-[2]" />
        </div>
      );
    }
  }

  if (type === "price_alert") {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
        <BellRing className="w-4 h-4 stroke-[2]" />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
      <Inbox className="w-4 h-4 stroke-[2]" />
    </div>
  );
}

export function NotificationBell({ asMenuItem }: { asMenuItem?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    };

    fetchNotifications();

    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // Check for daily portfolio variation and create alerts if needed
  useEffect(() => {
    if (!user) return;

    const checkPortfolioVariation = async () => {
      try {
        // ── Guard: no disparar alertas de variación "de hoy" si el mercado no
        //    operó hoy (findes de semana, festivos). En esos días Yahoo devuelve
        //    la cotización congelada del último día hábil, con el % de cambio de
        //    ese día — y la lógica la confundiría con un movimiento "de hoy".
        //    Verificamos dos condiciones:
        //    1) Hoy es sábado (6) o domingo (0) → mercado de renta variable
        //       cerrado (suficiente para el caso reportado por el usuario).
        //    2) Refuerzo: si los datos traen regularMarketTime, comprobamos que
        //       el último precio sea realmente del día calendario de hoy.
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Dom, 6=Sáb
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return;
        }

        // Cooldown check (15 minutes locally to avoid overloading)
        const LOCAL_COOLDOWN_MS = 15 * 60 * 1000;
        const lastCheck = localStorage.getItem(`last_portfolio_check_${user.id}`);
        if (lastCheck && Date.now() - parseInt(lastCheck) < LOCAL_COOLDOWN_MS) {
          return;
        }
        localStorage.setItem(`last_portfolio_check_${user.id}`, Date.now().toString());

        // Check for existing notifications created in the last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: existingNotifs } = await supabase
          .from("notifications")
          .select("id, type, title, message")
          .eq("user_id", user.id)
          .in("type", ["portfolio_pnl", "asset_pnl"])
          .gt("created_at", oneDayAgo);

        // Fetch user's portfolios
        const { data: dbAssets } = await supabase
          .from("portfolios")
          .select("*")
          .eq("user_id", user.id);

        if (!dbAssets || dbAssets.length === 0) return;

        // Get symbols list
        const symbols = dbAssets.map((a) => a.symbol).join(",");
        const res = await fetch(`/api/finance/portfolio?symbols=${symbols}`);
        if (!res.ok) return;
        const liveData = await res.json();

        // Calculate total portfolio daily change and individual changes
        const enriched = dbAssets.map((dbA) => {
          const live = liveData.find((l: any) => l.symbol === dbA.symbol) || {};
          return {
            ...dbA,
            price: live.price || 0,
            change: live.change || 0,
            changePercent: live.changePercent || 0,
            // regularMarketTime viene en segundos (epoch) desde Yahoo Finance.
            regularMarketTime: live.regularMarketTime ?? null,
            shares: dbA.shares || 0,
          };
        });

        // ── Refuerzo anti-falso-positivo: además del corte por día de la
        //    semana, comprobamos que la cotización sea realmente del día de
        //    hoy. Si el último precio es de un día anterior (festivo en EE.UU.,
        //    cierre adelantado, mercado cerrado por cualquier motivo), los
        //    % de cambio no corresponden a "hoy" y no debemos notificar.
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const freshQuotes = enriched.filter(
          (a) => typeof a.regularMarketTime === "number"
        );
        if (freshQuotes.length > 0) {
          // Si NINGÚN activo tiene cotización del día de hoy, abortamos.
          const anyFreshToday = freshQuotes.some((a) => {
            const quoteDate = new Date((a.regularMarketTime as number) * 1000);
            return quoteDate.getTime() >= startOfToday.getTime();
          });
          if (!anyFreshToday) {
            return;
          }
        }

        // 1. Check Portfolio-Wide Variation (if not notified today)
        const hasPortfolioNotif = existingNotifs?.some((n) => n.type === "portfolio_pnl");
        if (!hasPortfolioNotif) {
          let hasShares = false;
          enriched.forEach((a) => {
            if (a.shares > 0) hasShares = true;
          });
          let totalChange = 0;

          if (hasShares) {
            let prevTotalValue = 0;
            let totalAbsoluteChange = 0;
            enriched.forEach((a) => {
              if (a.shares > 0) {
                const currentPosValue = a.price * a.shares;
                const prevPrice = a.price - a.change;
                const prevPosValue = prevPrice * a.shares;
                prevTotalValue += prevPosValue;
                totalAbsoluteChange += a.change * a.shares;
              }
            });
            totalChange = prevTotalValue > 0 ? (totalAbsoluteChange / prevTotalValue) * 100 : 0;
          } else {
            totalChange = enriched.length > 0
              ? enriched.reduce((sum, a) => sum + (a.changePercent || 0), 0) / enriched.length
              : 0;
          }

          const portfolioThreshold = 3.0;
          if (Math.abs(totalChange) >= portfolioThreshold) {
            const formattedChange = Math.abs(totalChange).toFixed(2);
            let title = "";
            let message = "";

            if (totalChange <= -5.0) {
              title = "⚠️ Caída importante en tu portafolio";
              message = `Tu portafolio cayó un ${formattedChange}% hoy. Haz clic aquí para que analicemos juntos qué activos están afectando tu rendimiento.`;
            } else if (totalChange < -3.0) {
              title = "📉 Alerta de variación en tu portafolio";
              message = `Tu portafolio ha bajado un ${formattedChange}% hoy. ¿Quieres que analise los factores del mercado detrás de esta caída?`;
            } else if (totalChange >= 5.0) {
              title = "🚀 ¡Excelente rendimiento hoy!";
              message = `¡Tu portafolio despegó un ${formattedChange}% hoy! Haz clic aquí para analizar el rally y planificar tus siguientes movimientos.`;
            } else if (totalChange > 3.0) {
              title = "📈 ¡Buen rendimiento en tus inversiones!";
              message = `Tu portafolio subió un ${formattedChange}% hoy. ¿Quieres ver cuáles son los activos que están impulsando tus ganancias?`;
            }

            if (title && message) {
              await supabase.from("notifications").insert({
                user_id: user.id,
                type: "portfolio_pnl",
                title,
                message,
                is_read: false,
              });
            }
          }
        }

        // 2. Check Individual Asset Variation (umbral de +-5%)
        for (const asset of enriched) {
          const changePercent = asset.changePercent || 0;
          const symbol = asset.symbol;
          const companyName = asset.company_name || symbol;
          const assetThreshold = 5.0;

          if (Math.abs(changePercent) >= assetThreshold) {
            // Check if we already notified about this specific asset today
            const alreadyNotified = existingNotifs?.some((n) =>
              n.type === "asset_pnl" && (n.title.includes(symbol) || n.message.includes(symbol))
            );

            if (alreadyNotified) continue;

            const formattedChange = Math.abs(changePercent).toFixed(2);
            let title = "";
            let message = "";

            if (changePercent <= -5.0) {
              title = `📉 Caída en ${symbol}`;
              message = `${companyName} (${symbol}) ha bajado un ${formattedChange}% hoy. ¿Quieres que analise qué eventos están afectando su cotización?`;
            } else if (changePercent >= 5.0) {
              title = `🚀 Rally en ${symbol}`;
              message = `¡${companyName} (${symbol}) subió un ${formattedChange}% hoy! Haz clic aquí para analizar los catalizadores de este movimiento.`;
            }

            if (title && message) {
              await supabase.from("notifications").insert({
                user_id: user.id,
                type: "asset_pnl",
                title,
                message,
                is_read: false,
              });
            }
          }
        }
      } catch (err) {
        console.error("Error in checkPortfolioVariation:", err);
      }
    };

    // Run check after a short delay to not block initial page render
    const timer = setTimeout(() => {
      checkPortfolioVariation();
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, supabase]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async () => {
    if (unreadCount === 0 || !user) return;
    
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  };

  const clearAll = async () => {
    if (notifications.length === 0 || !user) return;
    setNotifications([]);
    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAsRead();
        }}
        className={asMenuItem 
          ? "w-full flex items-center justify-between py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm transition-colors text-gray-900 dark:text-gray-100 cursor-pointer outline-none"
          : "relative flex items-center justify-center w-8 h-8 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors focus:outline-none cursor-pointer"
        }
        title="Notificaciones"
      >
        {asMenuItem ? (
          <div className="flex items-center">
            <Bell className="w-4 h-4 mr-2 text-gray-500" />
            <span className="font-medium">Notificaciones</span>
          </div>
        ) : (
          <Bell className="w-4.5 h-4.5 stroke-[1.75]" />
        )}
        {unreadCount > 0 && (
          <span className={asMenuItem
            ? "px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse"
            : "absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-[1.5px] border-white dark:border-zinc-900 shadow-sm animate-pulse"
          }>
            {asMenuItem && (unreadCount > 9 ? "9+" : unreadCount)}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop spacer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            {/* Notifications Popover aligned with left edge of sidebar, expanding rightwards */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={cn(
                "z-50 overflow-hidden bg-white dark:bg-zinc-950 border border-gray-200/80 dark:border-white/5 rounded-3xl shadow-2xl flex flex-col",
                asMenuItem 
                  ? "fixed inset-x-4 top-20 max-w-sm mx-auto"
                  : "fixed bottom-20 left-4 right-4 max-w-[320px] mx-auto md:absolute md:bottom-full md:mb-2.5 md:left-0 md:right-auto md:max-w-none md:w-[320px]"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between select-none">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notificaciones</h3>
                
                {/* Options button */}
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => {
                      if (unreadCount > 0) markAsRead();
                      else alert("Ya están todas leídas");
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-50 dark:hover:bg-white/5"
                    title="Opciones"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Body list */}
              <div className="max-h-[320px] overflow-y-auto hidden-scrollbar">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
                    <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3 stroke-[1.25]" />
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Tus notificaciones aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={async () => {
                          // Mark as read in UI and DB
                          if (!notif.is_read) {
                            setNotifications((prev) =>
                              prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
                            );
                            await supabase
                              .from("notifications")
                              .update({ is_read: true })
                              .eq("id", notif.id);
                          }

                          // Action handler for portfolio_pnl and asset_pnl
                          if (notif.type === "portfolio_pnl" || notif.type === "asset_pnl") {
                            setIsOpen(false);
                            let promptText = "";
                            if (notif.type === "portfolio_pnl") {
                              if (
                                notif.title.includes("Caída") ||
                                notif.title.includes("variación") ||
                                notif.message.includes("cayó") ||
                                notif.message.includes("bajó")
                              ) {
                                promptText = `Analiza por qué mi portafolio bajó hoy. Ayúdame a entender qué factores del mercado o de las empresas en mi portafolio están causando esta variación negativa y qué recomendaciones me sugieres para mitigar pérdidas.`;
                              } else {
                                promptText = `Analiza el rendimiento positivo de mi portafolio hoy. Me gustaría saber qué noticias u eventos del mercado están impulsando estas ganancias en mis activos y cómo puedo optimizar mi estrategia para aprovechar este rally.`;
                              }
                            } else {
                              // Extract symbol, e.g. "Caída en AAPL" or "Rally en AAPL" or message text
                              const match = notif.title.match(/(?:en\s+)([A-Z0-9.\-]+)/i) || notif.message.match(/(?:\(([A-Z0-9.\-]+)\))/i);
                              const symbol = match ? match[1].toUpperCase() : "";
                              
                              if (
                                notif.title.includes("Caída") ||
                                notif.message.includes("bajó")
                              ) {
                                promptText = `Analiza la caída reciente de ${symbol || 'este activo'}. Investiga las últimas noticias, reportes de ganancias o factores macroeconómicos que expliquen esta caída de precio y proporciona un análisis detallado sobre su soporte técnico y perspectivas a corto plazo.`;
                              } else {
                                promptText = `Analiza el rally y la subida de precio de ${symbol || 'este activo'}. Busca noticias relevantes, catalizadores de crecimiento o anuncios corporativos recientes que expliquen esta alza y analiza si tiene potencial para continuar subiendo.`;
                              }
                            }
                            router.push(`/ai?prompt=${encodeURIComponent(promptText)}`);
                          }
                        }}
                        className={cn(
                          "px-4 py-3.5 border-b border-gray-150 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer flex gap-3 items-start relative group",
                          !notif.is_read && "bg-teal-500/[0.01] dark:bg-teal-450/[0.01]"
                        )}
                      >
                        {getNotificationIcon(notif.type, notif.title, notif.message)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-0.5 truncate group-hover:text-[#1890FF] transition-colors">
                              {notif.title}
                            </h4>
                            {!notif.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          
                          {(notif.type === "portfolio_pnl" || notif.type === "asset_pnl") && (
                            <div className="mt-2 flex items-center gap-1.5 text-[9px] text-[#1890FF] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              <Sparkles className="w-3 h-3 animate-pulse" />
                              <span>Haz clic para analizar con IA</span>
                            </div>
                          )}
                          
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-2 block font-medium">
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Bell, MoreHorizontal, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell({ asMenuItem }: { asMenuItem?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const supabase = createClient();

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
            ? "px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full"
            : "absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"
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
                "z-50 overflow-hidden bg-white dark:bg-[#0B1329] border border-gray-200/80 dark:border-white/5 rounded-3xl shadow-2xl flex flex-col",
                asMenuItem 
                  ? "fixed inset-x-4 top-20 max-w-sm mx-auto"
                  : "absolute bottom-full mb-2.5 left-0 w-[320px]"
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
                        className={cn(
                          "px-4 py-3.5 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors",
                          !notif.is_read && "bg-teal-500/[0.03] dark:bg-teal-450/[0.03]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-0.5 truncate">
                            {notif.title}
                          </h4>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1.5 block font-medium">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
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

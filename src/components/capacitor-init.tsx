"use client";

import { useEffect } from "react";

export function CapacitorInit() {
  useEffect(() => {
    const init = async () => {
      // Only run on native platforms
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      // --- Status Bar (theme-aware) ---
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");

        const updateStatusBar = () => {
          const isDark = document.documentElement.classList.contains("dark");
          StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
          if (Capacitor.getPlatform() === "android") {
            StatusBar.setBackgroundColor({
              color: isDark ? "#0F172A" : "#FFFFFF",
            });
          }
        };

        // Set initial state
        updateStatusBar();

        // Watch for theme changes
        const observer = new MutationObserver(updateStatusBar);
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });
      } catch (e) {
        console.warn("StatusBar plugin not available:", e);
      }

      // --- Keyboard ---
      try {
        const { Keyboard } = await import("@capacitor/keyboard");
        Keyboard.setAccessoryBarVisible({ isVisible: false });
      } catch (e) {
        console.warn("Keyboard plugin not available:", e);
      }

      // --- Push Notifications ---
      try {
        const { PushNotifications } = await import(
          "@capacitor/push-notifications"
        );

        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive === "granted") {
          await PushNotifications.register();
        }

        PushNotifications.addListener("registration", (token) => {
          console.log("[Reclu] Push registration token:", token.value);
        });

        PushNotifications.addListener("registrationError", (err) => {
          console.error("[Reclu] Push registration error:", err.error);
        });

        PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("[Reclu] Push received in foreground:", notification);
          }
        );

        PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (notification) => {
            const data = notification.notification.data;
            if (data?.articleId) {
              window.location.href = `/article/${data.articleId}`;
            } else if (data?.url) {
              window.location.href = data.url;
            }
          }
        );
      } catch (e) {
        console.warn("PushNotifications plugin not available:", e);
      }
    };

    init();
  }, []);

  return null;
}

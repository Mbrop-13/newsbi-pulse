"use client";

import { useEffect } from "react";

export function CapacitorInit() {
  useEffect(() => {
    const init = async () => {
      // Only run on native platforms
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      // --- Status Bar ---
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Dark });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#0F172A" });
        }
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

        // Log token for debugging
        PushNotifications.addListener("registration", (token) => {
          console.log("[Reclu] Push registration token:", token.value);
          // TODO: Save token to Supabase user_profiles table
        });

        PushNotifications.addListener("registrationError", (err) => {
          console.error("[Reclu] Push registration error:", err.error);
        });

        // Notification received while app is open
        PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("[Reclu] Push received in foreground:", notification);
          }
        );

        // User tapped on notification
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

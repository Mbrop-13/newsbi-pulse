"use client";

import { useEffect } from "react";

/**
 * Captura `?ref=CODE` en la URL y lo persiste en una cookie `mav_ref` (30 días,
 * SameSite=Lax para que viaje al callback de OAuth) + localStorage. Luego limpia
 * la URL sin recargar. El callback de auth lee la cookie para vincular el
 * referido al referrer en el momento del signup (ver attachReferrerOnSignup).
 */
export function ReferralAttribution() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (!ref) return;

    const code = ref.toUpperCase().slice(0, 12);
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `mav_ref=${code}; expires=${expires}; path=/; SameSite=Lax`;
    try {
      localStorage.setItem("mav_ref", code);
    } catch {}

    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.toString());
  }, []);

  return null;
}

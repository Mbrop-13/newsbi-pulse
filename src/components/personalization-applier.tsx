"use client";

import { useEffect } from "react";
import {
  usePersonalizationStore,
  FONT_SIZE_MAP,
  IMAGE_RADIUS_MAP,
  DENSITY_MAP,
} from "@/lib/stores/personalization-store";

/**
 * Applies personalization settings as CSS custom properties on <html>.
 * Renders nothing — just syncs Zustand store → DOM.
 */
export function PersonalizationApplier() {
  const { fontSize, imageRadius, contentDensity } = usePersonalizationStore();

  useEffect(() => {
    const root = document.documentElement;
    const fs = FONT_SIZE_MAP[fontSize];
    const ir = IMAGE_RADIUS_MAP[imageRadius];
    const dn = DENSITY_MAP[contentDensity];

    root.style.setProperty("--p-font-base", fs.base);
    root.style.setProperty("--p-font-article", fs.article);
    root.style.setProperty("--p-heading-scale", fs.heading);
    root.style.setProperty("--p-img-radius", ir);
    root.style.setProperty("--p-gap", dn.gap);
    root.style.setProperty("--p-padding", dn.padding);
  }, [fontSize, imageRadius, contentDensity]);

  return null;
}

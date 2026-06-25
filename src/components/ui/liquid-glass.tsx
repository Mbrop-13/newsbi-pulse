"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Cache for generated blob URLs to prevent memory leaks and redundant canvas drawing
const blobCache = new Map<string, Promise<string>>();

/**
 * Generates a high-fidelity squircle displacement map for optical refraction.
 * Channel mapping:
 * - R: Horizontal displacement (128 = no change, >128 = shift right, <128 = shift left)
 * - G: Vertical displacement (128 = no change, >128 = shift down, <128 = shift up)
 * - B: Specular heightmap for simulated rim lighting / bevel reflections
 */
function getSquircleDisplacementMap(w: number, h: number, radius: number): Promise<string> {
  const cacheKey = `${w}x${h}r${radius}`;
  if (blobCache.has(cacheKey)) {
    return blobCache.get(cacheKey)!;
  }

  const promise = new Promise<string>((resolve) => {
    // Generate at 0.5x scale for optimal rendering performance
    const scale = 0.5;
    const canvasWidth = Math.max(16, Math.round(w * scale));
    const canvasHeight = Math.max(16, Math.round(h * scale));
    const r = Math.max(4, Math.round(radius * scale));

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve("");
      return;
    }

    const imgData = ctx.createImageData(canvasWidth, canvasHeight);
    const data = imgData.data;

    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    const rimWidth = 14 * scale; // Width of the refraction rim (bevel)
    const gain = 22 * scale; // Refraction displacement intensity

    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        // Rounded rectangle Signed Distance Field (SDF) calculation
        const dx = Math.abs(x - cx) - (canvasWidth / 2 - r);
        const dy = Math.abs(y - cy) - (canvasHeight / 2 - r);

        let dist = 0;
        let nx = 0;
        let ny = 0;

        if (dx > 0 && dy > 0) {
          const len = Math.sqrt(dx * dx + dy * dy);
          dist = len - r;
          nx = len > 0 ? (dx / len) * Math.sign(x - cx) : 0;
          ny = len > 0 ? (dy / len) * Math.sign(y - cy) : 0;
        } else {
          dist = Math.max(dx, dy);
          if (dx > dy) {
            nx = Math.sign(x - cx);
            ny = 0;
          } else {
            nx = 0;
            ny = Math.sign(y - cy);
          }
        }

        let rVal = 128;
        let gVal = 128;
        let bVal = 0;

        if (dist < 0) {
          const dEdge = -dist;
          if (dEdge < rimWidth) {
            const u = dEdge / rimWidth; // 0 at outer edge, 1 at flat center
            
            // Optical Squircle dome slope calculation from Outpace Studios
            const u_minus_1 = 1 - u;
            const denom = 1 - Math.pow(u_minus_1, 4);
            const slope = Math.pow(u_minus_1, 3) / Math.pow(Math.max(denom, 0.001), 0.75);

            // Refraction using Snell's Law (Index of refraction = 1.5 for glass)
            const thetaI = Math.atan(slope);
            const thetaT = Math.asin(Math.sin(thetaI) / 1.5);
            const bend = Math.sin(thetaI - thetaT);

            const dispX = nx * bend * gain;
            const dispY = ny * bend * gain;

            rVal = Math.round(128 + dispX);
            gVal = Math.round(128 + dispY);
            // Highlight specular reflections along the rim
            bVal = Math.round(245 * (1 - u));
          }
        }

        const idx = (y * canvasWidth + x) * 4;
        data[idx] = rVal;     // R
        data[idx + 1] = gVal; // G
        data[idx + 2] = bVal; // B (Specular highlight)
        data[idx + 3] = 255;  // A
      }
    }

    ctx.putImageData(imgData, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve(url);
      } else {
        resolve("");
      }
    }, "image/png");
  });

  blobCache.set(cacheKey, promise);
  return promise;
}

interface LiquidGlassLensProps {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  intensity?: number;
}

export function LiquidGlassLens({
  children,
  className,
  radius = 12,
  intensity = 20,
}: LiquidGlassLensProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [mapUrl, setMapUrl] = React.useState<string | null>(null);
  const [filterId] = React.useState(() => `lg-refract-${Math.random().toString(36).slice(2, 11)}`);

  // Dynamically measure dimensions to generate precise squircle dome map
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      // Round to nearest integer to stabilize map generation
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    };

    updateSize();

    // Use ResizeObserver for perfect fluidity when elements resize / animate
    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Generate the displacement map when dimensions change
  React.useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    let active = true;
    getSquircleDisplacementMap(dimensions.width, dimensions.height, radius).then((url) => {
      if (active) {
        setMapUrl(url);
      }
    });

    return () => {
      active = false;
    };
  }, [dimensions, radius]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-xl overflow-visible p-1 outline-none select-none",
        className
      )}
    >
      {/* Dynamic SVG Filter definition for this lens instance (Safari compatible) */}
      {mapUrl && (
        <svg className="pointer-events-none absolute hidden" width="0" height="0">
          <defs>
            <filter id={filterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
              {/* Load the computed displacement map */}
              <feImage href={mapUrl} result="displacementMap" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" />
              
              {/* Displace the background visual layer based on the map R/G channels */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="displacementMap"
                scale={intensity}
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />

              {/* Extract the Blue channel (specular reflections) to create the bright rim bevel light */}
              <feColorMatrix
                in="displacementMap"
                type="matrix"
                values="0 0 0 0 1
                        0 0 0 0 1
                        0 0 0 0 1
                        0 0 1 0 0"
                result="specularMask"
              />
              
              {/* Combine the bright specular highlight over the displaced background */}
              <feComposite in="specularMask" in2="displaced" operator="over" />
            </filter>
          </defs>
        </svg>
      )}

      {/* Layer 0: The actual backdrop-blur effect provided by the browser */}
      <div className="absolute inset-0 z-0 rounded-xl overflow-hidden pointer-events-none bg-white/30 dark:bg-black/20 backdrop-blur-2xl" />

      {/* Layer 1: The optical Glass Lens (deformed in rim/border, contains specular border lighting) */}
      <div
        className="absolute inset-0 z-10 rounded-xl pointer-events-none bg-gradient-to-b from-white/70 to-white/40 dark:from-zinc-900/60 dark:to-black/30 border border-white/45 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]"
        style={mapUrl ? { 
          filter: `url(#${filterId})`,
          backdropFilter: `url(#${filterId})`,
          WebkitBackdropFilter: `url(#${filterId})`
        } : undefined}
      />

      {/* Layer 2: Fully interactive, un-distorted text & option items on top */}
      <div className="relative z-20 w-full h-full">
        {children}
      </div>
    </div>
  );
}

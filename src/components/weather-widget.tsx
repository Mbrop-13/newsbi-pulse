"use client";

import { useEffect, useState } from "react";
import { Sun, Cloud, CloudRain, CloudSun, CloudDrizzle, CloudSnow, CloudLightning, Wind, MapPin, Loader2 } from "lucide-react";

// Mapea el código WMO de Open-Meteo a un icono + descripción
function interpretWeatherCode(code: number): { icon: React.ComponentType<any>; label: string } {
  if (code === 0) return { icon: Sun, label: "Despejado" };
  if (code <= 2) return { icon: CloudSun, label: "Parcialmente nublado" };
  if (code === 3) return { icon: Cloud, label: "Nublado" };
  if (code <= 48) return { icon: CloudDrizzle, label: "Neblina" };
  if (code <= 57) return { icon: CloudDrizzle, label: "Llovizna" };
  if (code <= 67) return { icon: CloudRain, label: "Lluvia" };
  if (code <= 77) return { icon: CloudSnow, label: "Nieve" };
  if (code <= 82) return { icon: CloudRain, label: "Chubascos" };
  if (code <= 86) return { icon: CloudSnow, label: "Nieve" };
  if (code >= 95) return { icon: CloudLightning, label: "Tormenta" };
  return { icon: Cloud, label: "Nublado" };
}

interface WeatherData {
  temp: number;
  maxTemp: number;
  minTemp: number;
  cityName: string;
  hourly: { hour: string; temp: number; code: number }[];
  currentCode: number;
  windSpeed: number;
}

type Status = "loading" | "permission" | "ready" | "error";

export function WeatherWidget() {
  const [status, setStatus] = useState<Status>("loading");
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchWeather = async () => {
      // 1. Obtener posición del usuario
      if (!("geolocation" in navigator)) { setStatus("error"); return; }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const { latitude, longitude } = pos.coords;
          try {
            // 2. Reverse geocoding (nombre de ciudad) — Open-Meteo, sin API key
            const geoRes = await fetch(
              `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=es&count=1`
            );
            let cityName = "Tu ubicación";
            if (geoRes.ok) {
              const geo = await geoRes.json();
              cityName = geo?.results?.[0]?.name || geo?.results?.[0]?.admin3 || "Tu ubicación";
            }

            // 3. Clima actual + horario — Open-Meteo, sin API key
            const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
              `&current=temperature_2m,weather_code,wind_speed_10m` +
              `&hourly=temperature_2m,weather_code` +
              `&daily=temperature_2m_max,temperature_2m_min` +
              `&timezone=auto&forecast_days=1`
            );
            if (!weatherRes.ok) throw new Error();
            const w = await weatherRes.json();

            // Próximas 5 horas desde la hora actual
            const nowIdx = w.hourly?.time?.findIndex((t: string) => new Date(t).getTime() >= Date.now() - 3600000) ?? 0;
            const startIdx = Math.max(0, nowIdx);
            const hourly = [];
            for (let i = startIdx; i < Math.min(startIdx + 5, w.hourly.time.length); i++) {
              const d = new Date(w.hourly.time[i]);
              hourly.push({
                hour: d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
                temp: Math.round(w.hourly.temperature_2m[i]),
                code: w.hourly.weather_code[i],
              });
            }

            if (cancelled) return;
            setWeather({
              temp: Math.round(w.current.temperature_2m),
              maxTemp: Math.round(w.daily.temperature_2m_max[0]),
              minTemp: Math.round(w.daily.temperature_2m_min[0]),
              cityName,
              hourly,
              currentCode: w.current.weather_code,
              windSpeed: Math.round(w.current.wind_speed_10m),
            });
            setStatus("ready");
          } catch {
            if (!cancelled) setStatus("error");
          }
        },
        (err) => {
          if (cancelled) return;
          // PERMISSION_DENIED → el usuario bloqueó la ubicación
          if (err.code === err.PERMISSION_DENIED) setStatus("permission");
          else setStatus("error");
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
      );
    };

    fetchWeather();
    return () => { cancelled = true; };
  }, []);

  // Estados de carga / error
  if (status === "loading") {
    return (
      <div className="bg-card rounded-2xl border border-border p-4.5 flex items-center justify-center gap-2 shadow-sm h-[120px]">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-xs text-gray-400">Cargando clima...</span>
      </div>
    );
  }

  if (status === "permission" || status === "error") {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 flex flex-col items-center justify-center gap-2 shadow-sm h-[120px] text-center">
        <MapPin className="w-5 h-5 text-gray-300 dark:text-gray-600" />
        <p className="text-[11px] text-gray-400 leading-snug">
          {status === "permission"
            ? "Activa el permiso de ubicación para ver el clima de tu ciudad"
            : "No se pudo cargar el clima"}
        </p>
      </div>
    );
  }

  if (!weather) return null;

  const current = interpretWeatherCode(weather.currentCode);
  const CurrentIcon = current.icon;

  return (
    <div className="bg-card rounded-2xl border border-border p-4.5 flex flex-col gap-4 shadow-sm">
      {/* Current Weather */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{weather.temp}°</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase">C</span>
          </div>
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            {weather.cityName}
          </span>
        </div>

        <div className="flex flex-col items-end gap-0.5 text-right">
          <CurrentIcon className="w-6 h-6 text-amber-500 dark:text-amber-400 mb-0.5" />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{current.label}</span>
          <span className="text-[11px] font-medium text-muted-foreground">M: {weather.maxTemp}° B: {weather.minTemp}°</span>
        </div>
      </div>

      {/* Hourly forecast */}
      {weather.hourly.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5 pt-1.5 border-t border-border/40">
          {weather.hourly.map((item, index) => {
            const { icon: Icon } = interpretWeatherCode(item.code);
            return (
              <div key={index} className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-[10px] font-bold text-muted-foreground/80">{item.hour}</span>
                <div className="w-7 h-7 rounded-full bg-secondary/50 dark:bg-white/5 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{item.temp}°</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Wind */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
        <Wind className="w-3 h-3" />
        <span>Viento: {weather.windSpeed} km/h</span>
      </div>
    </div>
  );
}

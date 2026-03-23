"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, Loader2, PlayCircle, Newspaper, X, ChevronRight, KeyRound, Globe2, Map as MapIcon, Settings, Hexagon, Mountain } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { searchLocation } from "@/lib/nominatim";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function GlobeMundo() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  const [points, setPoints] = useState<any[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [activePoint, setActivePoint] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [projection, setProjection] = useState<'globe' | 'mercator'>('globe');
  const [mapStyle, setMapStyle] = useState<'light-v11' | 'outdoors-v12'>('outdoors-v12');
  
  const debouncedSearch = useDebounceValue(searchQuery, 400);
  const supabase = createClient();

  // Fetch Initial News Points
  useEffect(() => {
    const fetchPoints = async () => {
      let fetchedPoints: any[] = [];
      const { data, error } = await supabase
        .from("news_articles")
        .select("id, title, category, published_at, is_live, lat, lng, city")
        .order("published_at", { ascending: false })
        .limit(100);

      if (data && !error) {
        fetchedPoints = data.filter((d) => d.lat != null && d.lng != null);
      }

      if (fetchedPoints.length < 5) {
        fetchedPoints.push(
          { id: "mock1", title: "Asamblea Constitucional en curso: Primeros Acuerdos", city: "Santiago", lat: -33.4489, lng: -70.6693, is_live: true, category: "política", published_at: new Date().toISOString(), imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=800&auto=format&fit=crop" },
          { id: "mock2", title: "Nueva tecnología cuántica anunciada revoluciona la computación", city: "Cupertino", lat: 37.3230, lng: -122.0322, is_live: false, category: "tecnología", published_at: new Date().toISOString(), imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop" },
          { id: "mock3", title: "Acuerdo comercial histórico cerrado tras meses de negociación", city: "Londres", lat: 51.5074, lng: -0.1278, is_live: false, category: "negocios", published_at: new Date().toISOString(), imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=800&auto=format&fit=crop" },
          { id: "mock4", title: "Lanzamiento espacial exitoso: Starship alcanza órbita", city: "Boca Chica", lat: 25.9973, lng: -97.1554, is_live: true, category: "ciencia", published_at: new Date().toISOString(), imageUrl: "https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=800&auto=format&fit=crop" },
          { id: "mock5", title: "Innovador avance descubierto por Qwen en bioingeniería", city: "Tokio", lat: 35.6762, lng: 139.6503, is_live: false, category: "tecnología", published_at: new Date().toISOString(), imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop" }
        );
      }
      
      setPoints(fetchedPoints);
    };
    fetchPoints();

    const channel = supabase
      .channel("public:news_articles")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "news_articles" },
        (payload: any) => {
          const newDoc = payload.new;
          if (newDoc.lat && newDoc.lng) {
            setPoints((prev) => [...prev, newDoc]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Init Mapbox Once
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setTokenMissing(true);
      return;
    }

    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: `mapbox://styles/mapbox/${mapStyle}`,
      projection: projection as any,
      zoom: 2.5,
      center: [-70.65, -33.45], // Chile
    });

    map.on('style.load', () => {
      // Light minimalist atmosphere to match monochrome data viz
      map.setFog({
        color: 'rgb(240, 242, 245)',
        'high-color': 'rgb(255, 255, 255)',
        'horizon-blend': 0.05,
        'space-color': 'rgb(230, 230, 230)',
        'star-intensity': 0.0
      });
    });

    map.on('error', (e) => {
      if (e.error?.message?.includes('style')) {
        console.warn("Style 'outdoors-v12' failed. Falling back to 'light-v11'");
        map.setStyle('mapbox://styles/mapbox/light-v11');
      }
    });

    map.on('click', () => {
      setActivePoint(null);
      setSearchQuery("");
      setHoveredPoint(null);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Projection dynamically
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setProjection(projection as any);
    }
  }, [projection]);

  // Update Style dynamically
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(`mapbox://styles/mapbox/${mapStyle}`);
    }
  }, [mapStyle]);

  // Sync Markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    points.forEach(p => {
      if (!markersRef.current[p.id]) {
        // Create outer container element so Mapbox can freely manipulate the position
        // without our scale transform overwriting it.
        const container = document.createElement('div');
        container.style.width = '24px';
        container.style.height = '24px';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';

        // Create inner visual element
        const el = document.createElement('div');
        const isLive = p.is_live;
        el.style.width = isLive ? '14px' : '12px';
        el.style.height = isLive ? '14px' : '12px';
        el.style.backgroundColor = isLive ? '#a855f7' : '#00A1FF'; 
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
        el.style.transition = 'transform 0.2s';
        
        container.appendChild(el);
        
        if (isLive) {
           el.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.4)', opacity: 0.5 },
            { transform: 'scale(1)', opacity: 1 }
           ], { duration: 2000, iterations: Infinity });
        }

        // Hover events for tooltip
        container.addEventListener('mouseenter', (e) => {
          setHoveredPoint(p);
          setMousePos({ x: e.clientX, y: e.clientY });
          el.style.transform = 'scale(1.3)';
        });
        container.addEventListener('mousemove', (e) => {
          setMousePos({ x: e.clientX, y: e.clientY });
        });
        container.addEventListener('mouseleave', () => {
          setHoveredPoint(null);
          el.style.transform = 'scale(1)';
        });
        container.addEventListener('click', (e) => {
          e.stopPropagation();
          handlePointClick(p);
        });

        const marker = new mapboxgl.Marker({ element: container })
          .setLngLat([p.lng, p.lat])
          .addTo(map);

        markersRef.current[p.id] = marker;
      }
    });

    // Cleanup removed points
    Object.keys(markersRef.current).forEach(id => {
      if (!points.find(p => p.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [points]);

  // Handle Search: Fly camera to searched location
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 3) return;
    const doSearch = async () => {
      setIsSearching(true);
      try {
        const result = await searchLocation(debouncedSearch);
        if (result && mapRef.current) {
          mapRef.current.flyTo({
            center: [result.lng, result.lat],
            zoom: 5,
            essential: true
          });
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setIsSearching(false);
      }
    };
    doSearch();
  }, [debouncedSearch]);

  const handlePointClick = useCallback((point: any) => {
    setActivePoint(point);
    if (mapRef.current && point) {
      mapRef.current.flyTo({
        center: [point.lng, point.lat],
        zoom: 6,
        essential: true
      });
    }
  }, []);

  const filteredPoints = useMemo(() => {
    if (searchQuery.length < 3) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return points.filter(p => 
      p.title?.toLowerCase().includes(lowerQuery) || 
      p.city?.toLowerCase().includes(lowerQuery) ||
      p.category?.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, points]);

  const showLeftPanel = searchQuery.length >= 3 || activePoint;

  if (tokenMissing) {
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-center px-4">
        <KeyRound className="w-16 h-16 text-slate-500 mb-6" />
        <h2 className="text-2xl font-editorial font-bold text-white mb-2">Token de Mapbox requerido</h2>
        <p className="text-slate-400 max-w-md">
          Para cargar el globo, necesitas agregar tu token de Mapbox a las variables de entorno.<br/><br/>
          Abre tu archivo <code className="bg-slate-800 text-accent px-2 py-1 rounded">.env.local</code> y agrega:
          <br/><br/>
          <code className="text-sm bg-slate-800 text-slate-300 px-4 py-3 rounded-xl block text-left">NEXT_PUBLIC_MAPBOX_TOKEN=tu_token_aqui</code>
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      
      {/* ─── MAPBOX CONTAINER ─── */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* ─── LEFT PANEL: Search + Results + Article ─── */}
      <AnimatePresence>
        {showLeftPanel && (
          <motion.div
            initial={{ x: -380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -380, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="absolute left-0 top-0 bottom-0 w-[360px] bg-white/95 backdrop-blur-2xl border-r border-slate-200/60 shadow-2xl z-40 flex flex-col"
          >
            {/* Search Input inside the panel */}
            <div className="px-5 pt-20 pb-3 flex-shrink-0">
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-accent/40 focus-within:border-accent transition-all">
                <Search className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar noticias o ciudad..."
                  className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 pl-10 pr-10 py-2.5 outline-none text-sm font-medium"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-accent absolute right-3 animate-spin" />
                )}
                {searchQuery && !isSearching && (
                  <button onClick={() => { setSearchQuery(""); setActivePoint(null); }} className="absolute right-3">
                    <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Active Article Detail */}
            <AnimatePresence mode="wait">
              {activePoint && (
                <motion.div
                  key="article"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-6"
                >
                  <button 
                    onClick={() => setActivePoint(null)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-accent transition-colors mb-3"
                  >
                    ← Volver a resultados
                  </button>

                  {activePoint.imageUrl && (
                    <div className="w-full h-48 rounded-xl overflow-hidden mb-4">
                      <img src={activePoint.imageUrl} alt={activePoint.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    {activePoint.is_live ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                        Urgente
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {activePoint.category}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium ml-auto">
                      {activePoint.city}
                    </span>
                  </div>
                  
                  <h2 className="text-lg font-editorial font-bold text-slate-900 leading-snug mb-4">
                    {activePoint.title}
                  </h2>
                  
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Resumen generado por IA de este suceso importante que está en desarrollo. Información recopilada de múltiples fuentes confiables en tiempo real. Este artículo es monitoreado continuamente y actualizado con los últimos datos disponibles de agencias internacionales.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2.5 rounded-lg transition-colors font-medium">
                      <PlayCircle className="w-4 h-4" />
                      Escuchar
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 bg-accent hover:bg-accent/90 text-white text-xs py-2.5 rounded-lg transition-colors font-medium">
                      <Newspaper className="w-4 h-4" />
                      Leer Completo
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Results List (only when no article is open) */}
            {!activePoint && searchQuery.length >= 3 && (
              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {filteredPoints.length} resultado{filteredPoints.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-col gap-2">
                  {filteredPoints.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePointClick(p)}
                      className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-3 text-left group hover:shadow-md hover:border-accent/30 transition-all w-full"
                    >
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {p.is_live && (
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse flex-shrink-0" />
                          )}
                          <span className="text-[10px] text-accent font-semibold uppercase tracking-wider truncate">
                            {p.city}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                          {p.title}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent flex-shrink-0 ml-auto transition-colors" />
                    </button>
                  ))}
                  
                  {filteredPoints.length === 0 && (
                    <div className="text-center text-slate-400 text-sm py-8">
                      No hay resultados para &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FLOATING SEARCH BUTTON (when panel is closed) ─── */}
      <AnimatePresence>
        {!showLeftPanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-20 left-6 z-50 pointer-events-auto"
          >
            <button
              onClick={() => setSearchQuery("   ")} // trigger panel open with spaces
              className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl flex items-center justify-center hover:bg-white hover:shadow-2xl hover:scale-105 transition-all group"
            >
              <Search className="w-5 h-5 text-slate-500 group-hover:text-accent transition-colors" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HOVER TOOLTIP (floating, tracks mouse on point hover) ─── */}
      <AnimatePresence>
        {hoveredPoint && !activePoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              transform: "translate(-50%, -100%)",
              marginTop: "-20px"
            }}
          >
            <div className="bg-slate-900/85 backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)] rounded-xl px-4 py-3 max-w-[220px]">
              <div className="flex items-center gap-2 mb-1">
                {hoveredPoint.is_live && (
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse flex-shrink-0" />
                )}
                <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider truncate">
                  {hoveredPoint.city}
                </span>
              </div>
              <p className="text-white text-xs font-semibold line-clamp-2 leading-snug">
                {hoveredPoint.title}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-auto">
        <button 
          onClick={() => mapRef.current?.zoomIn()}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-white transition-all shadow-md text-lg"
        >
          +
        </button>
        <button 
          onClick={() => mapRef.current?.zoomOut()}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-white transition-all shadow-md text-lg"
        >
          −
        </button>
      </div>

      {/* Settings Toggle UI (Style & Projection) */}
      <div className="absolute top-20 right-6 z-50 pointer-events-auto">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-10 h-10 outline-none rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl flex items-center justify-center hover:bg-white hover:shadow-2xl transition-all">
            <Settings className="w-5 h-5 text-slate-600" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
            {/* Styles Section */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-1">
              Estilo de Mapa
            </div>
            <DropdownMenuItem 
              className={`flex items-center gap-2 cursor-pointer rounded-lg py-2 ${mapStyle === 'light-v11' ? 'bg-accent/10 text-accent font-medium' : ''}`}
              onClick={() => setMapStyle('light-v11')}
            >
              <Hexagon className="w-4 h-4" />
              Minimalista (Monochrome)
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={`flex items-center gap-2 cursor-pointer rounded-lg py-2 ${mapStyle === 'outdoors-v12' ? 'bg-accent/10 text-accent font-medium' : ''}`}
              onClick={() => setMapStyle('outdoors-v12')}
            >
              <Mountain className="w-4 h-4" />
              Realista (Outdoors)
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            {/* Projection Section */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
              Proyección
            </div>
            <DropdownMenuItem 
              className={`flex items-center gap-2 cursor-pointer rounded-lg py-2 ${projection === 'globe' ? 'bg-accent/10 text-accent font-medium' : ''}`}
              onClick={() => setProjection('globe')}
            >
              <Globe2 className="w-4 h-4" />
              Vista 3D (Globo)
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={`flex items-center gap-2 cursor-pointer rounded-lg py-2 ${projection === 'mercator' ? 'bg-accent/10 text-accent font-medium' : ''}`}
              onClick={() => setProjection('mercator')}
            >
              <MapIcon className="w-4 h-4" />
              Vista 2D (Plano)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </div>
  );
}

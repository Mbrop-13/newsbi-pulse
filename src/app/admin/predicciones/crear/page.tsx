"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  Tag,
  X,
  Gem,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function AdminCrearPrediccionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [resolutionMethod, setResolutionMethod] = useState("");
  const [category, setCategory] = useState("politics");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [optionALabel, setOptionALabel] = useState("Sí");
  const [optionBLabel, setOptionBLabel] = useState("No");
  const [initialLiquidity, setInitialLiquidity] = useState(300);
  const [resolutionDate, setResolutionDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [tagFocused, setTagFocused] = useState(false);

  // Fetch existing tags from news articles
  useEffect(() => {
    fetch("/api/tags")
      .then(r => r.json())
      .then(d => { if (d.tags) setExistingTags(d.tags); })
      .catch(() => {});
  }, []);

  const filteredSuggestions = tagInput.trim()
    ? existingTags.filter(t => t.includes(tagInput.toLowerCase()) && !tags.includes(t)).slice(0, 10)
    : existingTags.filter(t => !tags.includes(t)).slice(0, 15);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const handleSubmit = async () => {
    if (!title) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        rules,
        resolution_method: resolutionMethod,
        category,
        tags,
        image_url: imageUrl || null,
        option_a_label: optionALabel,
        option_b_label: optionBLabel,
        initial_liquidity: initialLiquidity,
        resolution_date: resolutionDate || null,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/admin/predicciones"), 1500);
    } else {
      setError(data.error || "Error desconocido");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/predicciones" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-white transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver
          </Link>
          <h1 className="text-3xl font-bold text-white">Crear Mercado de Predicción</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !title || success}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {success ? "¡Creado!" : "Crear Mercado"}
        </button>
      </div>

      {error && (
        <div className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <input
            type="text"
            placeholder="¿Subirá el índice de aprobación de Trump esta semana?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#1E293B] border border-white/5 rounded-2xl px-5 py-4 text-xl font-bold text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
          />

          {/* Description */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Descripción</label>
            <textarea
              placeholder="Describe el evento de predicción..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          {/* Rules */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Reglas</label>
            <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
            >
              <option value="politics">Política</option>
              <option value="crypto">Cripto</option>
              <option value="economy">Economía</option>
              <option value="sports">Deportes</option>
              <option value="tech">Tecnología</option>
              <option value="world">Mundo</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400">Reglas Especiales (Opcional)</label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="w-full h-[52px] min-h-[52px] max-h-[150px] bg-slate-900/50 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-gray-600"
              placeholder="Ej: Si no hay decisión antes del 4 de Nov..."
            />
          </div>
        </div>
          </div>

          {/* Resolution Method */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Método de Resolución</label>
            <textarea
              placeholder="Ej: Se resolverá según datos de encuestas oficiales de Gallup..."
              value={resolutionMethod}
              onChange={(e) => setResolutionMethod(e.target.value)}
              rows={2}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* Options Labels */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Opciones</label>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
              <input
                type="text"
                placeholder="Opción A"
                value={optionALabel}
                onChange={(e) => setOptionALabel(e.target.value)}
                className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <input
                type="text"
                placeholder="Opción B"
                value={optionBLabel}
                onChange={(e) => setOptionBLabel(e.target.value)}
                className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          {/* Liquidity */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
              <Gem className="w-3 h-3" /> Liquidez Inicial (por opción)
            </label>
            <input
              type="number"
              value={initialLiquidity}
              onChange={(e) => setInitialLiquidity(parseInt(e.target.value) || 300)}
              min={100}
              max={10000}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50"
            />
            <p className="text-[10px] text-gray-600 mt-1">Pool arranca con {initialLiquidity} 💎 en cada opción</p>
          </div>

          {/* Resolution Date */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Fecha de Resolución
            </label>
            <input
              type="datetime-local"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Category */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 appearance-none"
            >
              <option value="politics">Política</option>
              <option value="economy">Economía</option>
              <option value="technology">Tecnología</option>
              <option value="sports">Deportes</option>
              <option value="world">Mundo</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Tags */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags (para matching con noticias)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Buscar o escribir tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                onFocus={() => setTagFocused(true)}
                onBlur={() => setTimeout(() => setTagFocused(false), 200)}
                className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
              />
              <button onClick={addTag} className="px-3 py-2 rounded-xl bg-purple-600/20 text-purple-400 text-xs font-bold hover:bg-purple-600/30 transition-colors">+</button>
            </div>

            {/* Tag Suggestions */}
            {tagFocused && filteredSuggestions.length > 0 && (
              <div className="mb-3 p-2 rounded-xl bg-black/30 border border-white/5 max-h-[160px] overflow-y-auto">
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider mb-1.5 px-1">Tags existentes</p>
                <div className="flex flex-wrap gap-1">
                  {filteredSuggestions.map(t => (
                    <button
                      key={t}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); if (!tags.includes(t)) setTags([...tags, t]); }}
                      className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-400 hover:bg-purple-500/15 hover:text-purple-400 transition-colors cursor-pointer"
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-[11px] text-purple-300 font-medium">
                  #{t}
                  <button onClick={() => setTags(tags.filter(x => x !== t))} className="text-gray-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Imagen (opcional)</label>
            <input
              type="text"
              placeholder="URL de imagen..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

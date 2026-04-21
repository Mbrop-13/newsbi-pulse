"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Eye,
  Code,
  Loader2,
  Save,
  Tag,
  X,
  ImageIcon,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function AdminEditarArticuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [relevanceScore, setRelevanceScore] = useState(0.5);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      const res = await fetch(`/api/admin/articles/${id}`);
      const data = await res.json();
      if (data.article) {
        const a = data.article;
        setTitle(a.title || "");
        setContent(a.enriched_content || a.content || "");
        setCategory(a.category || "general");
        setTags(a.tags || []);
        setImageUrl(a.image_url || "");
        setAuthor(a.author || "");
        setRelevanceScore(a.relevance_score || 0.5);
      }
      setLoading(false);
    }
    loadArticle();
  }, [id]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSubmit = async () => {
    if (!title || !content) return;
    setSaving(true);

    const res = await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        enriched_content: content,
        category,
        tags,
        image_url: imageUrl || null,
        author,
        relevance_score: relevanceScore,
      }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/admin/noticias"), 1500);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/noticias"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Noticias
          </Link>
          <h1 className="text-3xl font-bold text-white">Editar Artículo</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              showPreview
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {showPreview ? <Code className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Editor" : "Preview"}
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving || !title || !content || success}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {success ? "¡Guardado!" : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <input
            type="text"
            placeholder="Título del artículo..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#1E293B] border border-white/5 rounded-2xl px-5 py-4 text-xl font-bold text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />

          {showPreview ? (
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 min-h-[400px]">
              <div className="prose prose-invert prose-sm max-w-none prose-a:text-blue-400">
                <ReactMarkdown>{content || "*Sin contenido aún...*"}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <textarea
              placeholder="Escribe el contenido en Markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              className="w-full bg-[#1E293B] border border-white/5 rounded-2xl px-5 py-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono resize-none leading-relaxed"
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
              <ImageIcon className="w-3 h-3 inline mr-1" />
              Imagen de portada
            </label>
            <input
              type="text"
              placeholder="URL de la imagen..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
            />
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="mt-3 rounded-xl w-full h-32 object-cover bg-gray-800" />
            )}
          </div>

          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
            >
              <option value="general">General</option>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="politics">Politics</option>
              <option value="world">World</option>
            </select>
          </div>

          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
              <Tag className="w-3 h-3 inline mr-1" />
              Etiquetas
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Agregar tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 rounded-xl bg-blue-600/20 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-colors"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-[11px] text-gray-300 font-medium"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-gray-500 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Autor</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
              Relevancia: {Math.round(relevanceScore * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={relevanceScore}
              onChange={(e) => setRelevanceScore(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Upload,
  X,
  Sparkles,
  Loader2,
  Package,
  Globe,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useBrandStore,
  BRAND_TYPE_OPTIONS,
  LOGO_MODE_OPTIONS,
  MAX_BRAND_PRODUCTS,
  MAX_BRAND_URLS,
  MAX_LOGO_BYTES,
  type BrandFormProduct,
  type BrandFormPage,
  type BrandType,
  type LogoMode,
} from "@/lib/stores/brand-store";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { UpgradeModal } from "@/components/upgrade-modal";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function BrandFormDialog() {
  const isOpen = useBrandStore((s) => s.isFormOpen);
  const closeForm = useBrandStore((s) => s.closeForm);
  const brand = useBrandStore((s) => s.brand);
  const saveBrand = useBrandStore((s) => s.saveBrand);
  const startAnalysis = useBrandStore((s) => s.startAnalysis);
  const isLoading = useBrandStore((s) => s.isLoading);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAuthModal = useAuthModalStore((s) => s.openModal);

  const [name, setName] = useState("");
  const [brandType, setBrandType] = useState<BrandType>("online_store");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoMode, setLogoMode] = useState<LogoMode>("ai_decide");
  const [products, setProducts] = useState<BrandFormProduct[]>([]);
  const [pages, setPages] = useState<BrandFormPage[]>([]);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Hydrate form when opening
  useEffect(() => {
    if (!isOpen) return;
    if (brand) {
      setName(brand.name);
      setBrandType(brand.brand_type);
      setDescription(brand.description || "");
      setWebsiteUrl(brand.website_url || "");
      setLogoData(brand.logo_data);
      setLogoMode(brand.default_logo_mode);
      setProducts(
        brand.items
          .filter((i) => i.kind === "product")
          .map((i) => ({
            clientId: i.id,
            name: i.name,
            url: i.url || "",
            description: i.description || "",
          }))
      );
      setPages(
        brand.items
          .filter((i) => i.kind === "catalog" || i.kind === "page")
          .map((i) => ({
            clientId: i.id,
            name: i.name,
            url: i.url || "",
            kind: i.kind as "catalog" | "page",
          }))
      );
    } else {
      setName("");
      setBrandType("online_store");
      setDescription("");
      setWebsiteUrl("");
      setLogoData(null);
      setLogoMode("ai_decide");
      setProducts([]);
      setPages([]);
    }
  }, [isOpen, brand]);

  const countUrls = () => {
    let n = 0;
    if (websiteUrl.trim()) n++;
    products.forEach((p) => {
      if (p.url.trim()) n++;
    });
    pages.forEach((p) => {
      if (p.url.trim()) n++;
    });
    return n;
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes (PNG, JPG, WEBP, SVG).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("El logo no puede superar 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoData(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const addProduct = () => {
    if (products.length >= MAX_BRAND_PRODUCTS) {
      toast.error(`Máximo ${MAX_BRAND_PRODUCTS} productos.`);
      return;
    }
    setProducts((p) => [
      ...p,
      { clientId: uid(), name: "", url: "", description: "" },
    ]);
  };

  const addPage = () => {
    if (countUrls() >= MAX_BRAND_URLS) {
      toast.error(`Máximo ${MAX_BRAND_URLS} URLs en total.`);
      return;
    }
    setPages((p) => [
      ...p,
      { clientId: uid(), name: "", url: "", kind: "page" },
    ]);
  };

  const persist = async () => {
    if (!isAuthenticated) {
      openAuthModal("register");
      return null;
    }
    if (!name.trim()) {
      toast.error("Indica el nombre de tu marca.");
      return null;
    }
    if (countUrls() > MAX_BRAND_URLS) {
      toast.error(`Máximo ${MAX_BRAND_URLS} URLs en total.`);
      return null;
    }

    setSaving(true);
    try {
      const saved = await saveBrand({
        name: name.trim(),
        brand_type: brandType,
        description,
        logo_data: logoData,
        website_url: websiteUrl.trim(),
        default_logo_mode: logoMode,
        products: products.filter((p) => p.name.trim() || p.url.trim()),
        pages: pages.filter((p) => p.url.trim()),
      });
      if (!saved) {
        const err = useBrandStore.getState().error;
        toast.error(err || "No se pudo guardar la marca.");
        return null;
      }
      return saved;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const saved = await persist();
    if (saved) {
      toast.success("Marca guardada.");
      closeForm();
    }
  };

  const handleUnderstand = async () => {
    if (!websiteUrl.trim() && countUrls() === 0) {
      toast.error("Agrega al menos la web principal o una URL de producto.");
      return;
    }
    const saved = await persist();
    if (!saved) return;

    closeForm();
    setAnalyzing(true);
    try {
      const ok = await startAnalysis();
      if (!ok) {
        toast.error(
          useBrandStore.getState().error || "No se pudo analizar la marca."
        );
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === "TOKEN_LIMIT_REACHED") {
        setShowUpgrade(true);
      } else {
        toast.error(e?.message || "Error al analizar la marca.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent
          className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0 border-zinc-200/80 dark:border-zinc-800"
          showCloseButton={false}
        >
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-zinc-100 dark:border-zinc-800 px-5 py-4 flex items-start justify-between gap-3">
            <DialogHeader className="gap-1 text-left">
              <DialogTitle className="text-lg font-bold tracking-tight">
                {brand ? "Editar marca" : "Configurar marca"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Contexto, logo y productos para generar imágenes alineadas a tu
                identidad.
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={closeForm}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* Name + type */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Nombre de la marca</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Aurora Cosmetics"
                className="rounded-xl h-10"
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Tipo de marca</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BRAND_TYPE_OPTIONS.map((opt) => {
                  const active = brandType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBrandType(opt.id)}
                      className={cn(
                        "text-left rounded-xl border px-3 py-2.5 transition-all",
                        active
                          ? "border-[#1890FF]/50 bg-[#1890FF]/8 ring-1 ring-[#1890FF]/30"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      )}
                    >
                      <div className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Logo</Label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center overflow-hidden shrink-0">
                  {logoData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoData}
                      alt="Logo"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Upload className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg h-8 text-xs"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {logoData ? "Cambiar logo" : "Subir logo"}
                  </Button>
                  {logoData && (
                    <button
                      type="button"
                      onClick={() => setLogoData(null)}
                      className="text-[11px] text-zinc-500 hover:text-red-500 text-left"
                    >
                      Quitar logo
                    </button>
                  )}
                  <p className="text-[10px] text-zinc-400">
                    PNG, JPG, WEBP o SVG · máx. 1.5 MB
                  </p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogo}
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#1890FF]" />
                Sitio web principal
              </Label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://tumarca.com"
                className="rounded-xl h-10"
              />
            </div>

            {/* Context */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Contexto de la marca
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu marca, tono de voz, público, colores, diferenciadores..."
                className="rounded-xl min-h-[88px] resize-none"
                maxLength={4000}
              />
            </div>

            {/* Default logo mode */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Logo en generaciones (por defecto)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {LOGO_MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLogoMode(opt.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all",
                      logoMode === opt.id
                        ? "bg-[#1890FF]/10 border-[#1890FF]/40 text-[#1890FF]"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#1890FF]" />
                  Productos
                </Label>
                <button
                  type="button"
                  onClick={addProduct}
                  className="text-[11px] font-bold text-[#1890FF] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>
              {products.length === 0 ? (
                <p className="text-[11px] text-zinc-400 py-2">
                  Añade productos con su URL para que la IA entienda tu catálogo.
                </p>
              ) : (
                <div className="space-y-2">
                  {products.map((p, idx) => (
                    <div
                      key={p.clientId}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30"
                    >
                      <div className="flex gap-2">
                        <Input
                          value={p.name}
                          onChange={(e) =>
                            setProducts((list) =>
                              list.map((x, i) =>
                                i === idx ? { ...x, name: e.target.value } : x
                              )
                            )
                          }
                          placeholder="Nombre del producto"
                          className="rounded-lg h-9 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProducts((list) =>
                              list.filter((_, i) => i !== idx)
                            )
                          }
                          className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <Input
                        value={p.url}
                        onChange={(e) =>
                          setProducts((list) =>
                            list.map((x, i) =>
                              i === idx ? { ...x, url: e.target.value } : x
                            )
                          )
                        }
                        placeholder="URL del producto"
                        className="rounded-lg h-9 text-sm"
                      />
                      <Input
                        value={p.description}
                        onChange={(e) =>
                          setProducts((list) =>
                            list.map((x, i) =>
                              i === idx
                                ? { ...x, description: e.target.value }
                                : x
                            )
                          )
                        }
                        placeholder="Descripción breve (opcional)"
                        className="rounded-lg h-9 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extra pages */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[#1890FF]" />
                  Páginas adicionales
                </Label>
                <button
                  type="button"
                  onClick={addPage}
                  className="text-[11px] font-bold text-[#1890FF] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>
              {pages.length > 0 && (
                <div className="space-y-2">
                  {pages.map((p, idx) => (
                    <div
                      key={p.clientId}
                      className="flex gap-2 items-center"
                    >
                      <select
                        value={p.kind}
                        onChange={(e) =>
                          setPages((list) =>
                            list.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    kind: e.target.value as "catalog" | "page",
                                  }
                                : x
                            )
                          )
                        }
                        className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background text-xs px-2"
                      >
                        <option value="catalog">Catálogo</option>
                        <option value="page">Página</option>
                      </select>
                      <Input
                        value={p.name}
                        onChange={(e) =>
                          setPages((list) =>
                            list.map((x, i) =>
                              i === idx ? { ...x, name: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Nombre"
                        className="rounded-lg h-9 text-sm flex-1"
                      />
                      <Input
                        value={p.url}
                        onChange={(e) =>
                          setPages((list) =>
                            list.map((x, i) =>
                              i === idx ? { ...x, url: e.target.value } : x
                            )
                          )
                        }
                        placeholder="URL"
                        className="rounded-lg h-9 text-sm flex-[1.4]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPages((list) => list.filter((_, i) => i !== idx))
                        }
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-zinc-400">
                URLs a analizar: {countUrls()} / {MAX_BRAND_URLS}
              </p>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-zinc-100 dark:border-zinc-800 px-5 py-3.5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={handleSave}
              disabled={saving || analyzing || isLoading}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Guardar
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-[#1890FF] hover:bg-[#1580e6] text-white"
              onClick={handleUnderstand}
              disabled={saving || analyzing || isLoading}
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Entender marca con IA
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="ai_message"
      />
    </>
  );
}

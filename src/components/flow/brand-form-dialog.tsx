"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowLeft,
  ArrowRight,
  Check,
  ImageIcon,
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

type WizardStep = 1 | 2 | 3;

const STEP_HINTS: Record<WizardStep, string> = {
  1: "Nombre, tipo de negocio y sitio web",
  2: "Logo y cómo debe aparecer en las imágenes",
  3: "Productos y páginas para dar contexto a la IA",
};

export function BrandFormDialog() {
  const isOpen = useBrandStore((s) => s.isFormOpen);
  const closeForm = useBrandStore((s) => s.closeForm);
  const brand = useBrandStore((s) => s.brand);
  const saveBrand = useBrandStore((s) => s.saveBrand);
  const startAnalysis = useBrandStore((s) => s.startAnalysis);
  const isLoading = useBrandStore((s) => s.isLoading);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAuthModal = useAuthModalStore((s) => s.openModal);

  const [step, setStep] = useState<WizardStep>(1);
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

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
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

  const validateStep = (s: WizardStep): boolean => {
    if (s === 1) {
      if (!name.trim()) {
        toast.error("Indica el nombre de tu marca.");
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < 3) setStep((step + 1) as WizardStep);
  };

  const goBack = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
  };

  const goToStep = (target: WizardStep) => {
    if (target === step) return;
    if (target < step) {
      setStep(target);
      return;
    }
    for (let i = step; i < target; i++) {
      if (!validateStep(i as WizardStep)) return;
    }
    setStep(target);
  };

  const persist = async () => {
    if (!isAuthenticated) {
      openAuthModal("register");
      return null;
    }
    if (!name.trim()) {
      toast.error("Indica el nombre de tu marca.");
      setStep(1);
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
      if (!websiteUrl.trim()) setStep(1);
      else setStep(3);
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

  const busy = saving || analyzing || isLoading;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent
          className={cn(
            "w-[calc(100%-1.5rem)] sm:max-w-lg",
            "max-h-[88vh] overflow-hidden rounded-2xl p-0 gap-0",
            "border-zinc-200/80 dark:border-zinc-800",
            "flex flex-col"
          )}
          showCloseButton={false}
        >
          {/* Header — compacto */}
          <div className="shrink-0 px-5 pt-4 pb-3 flex items-start justify-between gap-3">
            <DialogHeader className="gap-0.5 text-left space-y-0">
              <DialogTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                {brand ? "Editar marca" : "Nueva marca"}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-zinc-500 dark:text-zinc-400">
                {STEP_HINTS[step]}
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={closeForm}
              className="p-1.5 -mr-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0 max-h-[min(58vh,520px)]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
                      Nombre
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Aurora Cosmetics"
                      className="rounded-lg h-10"
                      maxLength={80}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
                      Tipo
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {BRAND_TYPE_OPTIONS.map((opt) => {
                        const active = brandType === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setBrandType(opt.id)}
                            title={opt.desc}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg text-[12px] font-medium border transition-colors",
                              active
                                ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                                : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <Globe className="w-3 h-3" />
                      Sitio web
                    </Label>
                    <Input
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://tumarca.com"
                      className="rounded-lg h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
                      Contexto{" "}
                      <span className="font-normal text-zinc-400">(opcional)</span>
                    </Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tono, público, colores, estilo visual…"
                      className="rounded-lg min-h-[88px] resize-none text-[13px]"
                      maxLength={4000}
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex gap-4 items-start">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className={cn(
                        "w-[104px] h-[104px] shrink-0 rounded-xl border border-dashed",
                        "flex flex-col items-center justify-center gap-1.5 overflow-hidden transition-colors",
                        "hover:border-zinc-400 dark:hover:border-zinc-500",
                        logoData
                          ? "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40"
                      )}
                    >
                      {logoData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoData}
                          alt="Logo"
                          className="w-full h-full object-contain p-2.5"
                        />
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5 text-zinc-400" />
                          <span className="text-[11px] font-medium text-zinc-500">
                            Subir
                          </span>
                        </>
                      )}
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogo}
                    />

                    <div className="flex-1 min-w-0 space-y-2 pt-0.5">
                      <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-snug">
                        Sube el logo de tu marca. Opcional: puedes continuar sin
                        él.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg h-8 text-xs"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="w-3 h-3 mr-1.5" />
                          {logoData ? "Cambiar" : "Seleccionar"}
                        </Button>
                        {logoData && (
                          <button
                            type="button"
                            onClick={() => setLogoData(null)}
                            className="text-[12px] text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        PNG, JPG, WEBP o SVG · máx. 1.5 MB
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
                      Logo en generaciones
                    </Label>
                    <div className="grid grid-cols-1 gap-1">
                      {LOGO_MODE_OPTIONS.map((opt) => {
                        const active = logoMode === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setLogoMode(opt.id)}
                            className={cn(
                              "flex items-center justify-between text-left rounded-lg border px-3 py-2 transition-colors",
                              active
                                ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                                : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                            )}
                          >
                            <span
                              className={cn(
                                "text-[13px]",
                                active
                                  ? "font-medium text-zinc-900 dark:text-zinc-100"
                                  : "text-zinc-600 dark:text-zinc-400"
                              )}
                            >
                              {opt.label}
                            </span>
                            {active && (
                              <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  {/* Products */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                        <Package className="w-3 h-3" />
                        Productos{" "}
                        <span className="font-normal text-zinc-400">
                          (opcional)
                        </span>
                      </Label>
                      <button
                        type="button"
                        onClick={addProduct}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar
                      </button>
                    </div>

                    {products.length === 0 ? (
                      <button
                        type="button"
                        onClick={addProduct}
                        className="w-full rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-6 flex flex-col items-center text-center hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                      >
                        <Package className="w-4 h-4 text-zinc-400 mb-1.5" />
                        <span className="text-[13px] text-zinc-500">
                          Agregar producto
                        </span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        {products.map((p, idx) => (
                          <div
                            key={p.clientId}
                            className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-2"
                          >
                            <div className="flex gap-2 items-center">
                              <Input
                                value={p.name}
                                onChange={(e) =>
                                  setProducts((list) =>
                                    list.map((x, i) =>
                                      i === idx
                                        ? { ...x, name: e.target.value }
                                        : x
                                    )
                                  )
                                }
                                placeholder="Nombre del producto"
                                className="rounded-md h-8 text-[13px]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setProducts((list) =>
                                    list.filter((_, i) => i !== idx)
                                  )
                                }
                                className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2">
                              <Input
                                value={p.url}
                                onChange={(e) =>
                                  setProducts((list) =>
                                    list.map((x, i) =>
                                      i === idx
                                        ? { ...x, url: e.target.value }
                                        : x
                                    )
                                  )
                                }
                                placeholder="URL"
                                className="rounded-md h-8 text-[13px]"
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
                                placeholder="Descripción (opcional)"
                                className="rounded-md h-8 text-[13px]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Extra pages */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                        <Link2 className="w-3 h-3" />
                        Páginas{" "}
                        <span className="font-normal text-zinc-400">
                          (opcional)
                        </span>
                      </Label>
                      <button
                        type="button"
                        onClick={addPage}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Página
                      </button>
                    </div>

                    {pages.length > 0 && (
                      <div className="space-y-2">
                        {pages.map((p, idx) => (
                          <div
                            key={p.clientId}
                            className="flex gap-1.5 items-center"
                          >
                            <select
                              value={p.kind}
                              onChange={(e) =>
                                setPages((list) =>
                                  list.map((x, i) =>
                                    i === idx
                                      ? {
                                          ...x,
                                          kind: e.target
                                            .value as "catalog" | "page",
                                        }
                                      : x
                                  )
                                )
                              }
                              className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-[12px] px-1.5 w-[92px] shrink-0"
                            >
                              <option value="catalog">Catálogo</option>
                              <option value="page">Página</option>
                            </select>
                            <Input
                              value={p.name}
                              onChange={(e) =>
                                setPages((list) =>
                                  list.map((x, i) =>
                                    i === idx
                                      ? { ...x, name: e.target.value }
                                      : x
                                  )
                                )
                              }
                              placeholder="Nombre"
                              className="rounded-md h-8 text-[13px] flex-1 min-w-0"
                            />
                            <Input
                              value={p.url}
                              onChange={(e) =>
                                setPages((list) =>
                                  list.map((x, i) =>
                                    i === idx
                                      ? { ...x, url: e.target.value }
                                      : x
                                  )
                                )
                              }
                              placeholder="URL"
                              className="rounded-md h-8 text-[13px] flex-[1.3] min-w-0"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setPages((list) =>
                                  list.filter((_, i) => i !== idx)
                                )
                              }
                              className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-zinc-400">
                      URLs: {countUrls()} / {MAX_BRAND_URLS}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer: pasos pequeños + acciones */}
          <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-lg h-9 px-2.5 text-zinc-600 dark:text-zinc-400"
                  onClick={goBack}
                  disabled={busy}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Atrás
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-lg h-9 px-2.5 text-zinc-500"
                  onClick={closeForm}
                  disabled={busy}
                >
                  Cancelar
                </Button>
              )}

              {/* Mini step indicator */}
              <div
                className="hidden sm:flex items-center gap-1 ml-1"
                aria-label={`Paso ${step} de 3`}
              >
                {([1, 2, 3] as WizardStep[]).map((s) => {
                  const active = step === s;
                  const done = step > s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => goToStep(s)}
                      disabled={busy}
                      className={cn(
                        "w-6 h-6 rounded-full text-[11px] font-semibold transition-colors",
                        active &&
                          "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900",
                        done &&
                          !active &&
                          "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600",
                        !active &&
                          !done &&
                          "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      )}
                      aria-current={active ? "step" : undefined}
                      aria-label={`Paso ${s}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <span className="sm:hidden text-[11px] text-zinc-400 tabular-nums">
                {step}/3
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {step < 3 ? (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg h-9 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900"
                  onClick={goNext}
                  disabled={busy}
                >
                  Continuar
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg h-9 px-3"
                    onClick={handleSave}
                    disabled={busy}
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : null}
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-lg h-9 px-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-medium"
                    onClick={handleUnderstand}
                    disabled={busy}
                  >
                    {analyzing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Entender con IA
                  </Button>
                </>
              )}
            </div>
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

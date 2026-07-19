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
  Building2,
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

const STEPS: { id: WizardStep; label: string; short: string }[] = [
  { id: 1, label: "Identidad", short: "Marca" },
  { id: 2, label: "Logo", short: "Logo" },
  { id: 3, label: "Productos", short: "Catálogo" },
];

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
            "w-[calc(100%-1.5rem)] sm:max-w-3xl lg:max-w-4xl",
            "max-h-[90vh] overflow-hidden rounded-2xl p-0 gap-0",
            "border-zinc-200/80 dark:border-zinc-800",
            "flex flex-col"
          )}
          showCloseButton={false}
        >
          {/* Header */}
          <div className="shrink-0 border-b border-zinc-100 dark:border-zinc-800/80 px-6 sm:px-8 pt-5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <DialogHeader className="gap-1 text-left space-y-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                    Flow · Marca
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {brand ? "Editar marca" : "Configurar marca"}
                </DialogTitle>
                <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
                  {step === 1 &&
                    "Cuéntanos quién eres: nombre, tipo de negocio y tu sitio web."}
                  {step === 2 &&
                    "Sube tu logo y elige cómo debe aparecer en las generaciones."}
                  {step === 3 &&
                    "Añade productos y páginas para que la IA entienda tu catálogo."}
                </DialogDescription>
              </DialogHeader>
              <button
                type="button"
                onClick={closeForm}
                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors shrink-0"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper */}
            <div className="mt-5 flex items-center gap-0">
              {STEPS.map((s, idx) => {
                const active = step === s.id;
                const done = step > s.id;
                return (
                  <div key={s.id} className="flex items-center flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (s.id < step) setStep(s.id);
                        else if (s.id > step) {
                          for (let i = step; i < s.id; i++) {
                            if (!validateStep(i as WizardStep)) return;
                          }
                          setStep(s.id);
                        }
                      }}
                      className="flex items-center gap-2.5 min-w-0 group"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border transition-all",
                          done &&
                            "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent",
                          active &&
                            !done &&
                            "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent ring-4 ring-zinc-900/10 dark:ring-white/10",
                          !active &&
                            !done &&
                            "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700"
                        )}
                      >
                        {done ? <Check className="w-3.5 h-3.5" /> : s.id}
                      </div>
                      <div className="min-w-0 text-left hidden sm:block">
                        <p
                          className={cn(
                            "text-[11px] font-bold truncate leading-none",
                            active || done
                              ? "text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-400"
                          )}
                        >
                          {s.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                          Paso {s.id} de {STEPS.length}
                        </p>
                      </div>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "h-px flex-1 mx-3 sm:mx-4 transition-colors",
                          step > s.id
                            ? "bg-zinc-900 dark:bg-zinc-200"
                            : "bg-zinc-200 dark:bg-zinc-800"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 min-h-[320px] max-h-[min(52vh,480px)]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Nombre de la marca
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Aurora Cosmetics"
                        className="rounded-xl h-11 text-[15px]"
                        maxLength={80}
                        autoFocus
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Tipo de marca
                      </Label>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {BRAND_TYPE_OPTIONS.map((opt) => {
                          const active = brandType === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setBrandType(opt.id)}
                              className={cn(
                                "text-left rounded-xl border px-3.5 py-3 transition-all",
                                active
                                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900/[0.04] dark:bg-white/[0.06] ring-1 ring-zinc-900/20 dark:ring-white/20"
                                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                              )}
                            >
                              <div className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                                {opt.label}
                              </div>
                              <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                                {opt.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-zinc-500" />
                        Sitio web principal
                      </Label>
                      <Input
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://tumarca.com"
                        className="rounded-xl h-11 text-[15px]"
                      />
                      <p className="text-[11px] text-zinc-400">
                        La IA usará esta URL como base para entender tu marca.
                      </p>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Contexto de la marca
                      </Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tono de voz, público objetivo, colores, diferenciadores, estilo visual…"
                        className="rounded-xl min-h-[110px] resize-none text-[14px]"
                        maxLength={4000}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid sm:grid-cols-[200px_1fr] gap-6 items-start">
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Logo de la marca
                      </Label>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className={cn(
                          "w-full aspect-square max-w-[200px] rounded-2xl border-2 border-dashed",
                          "flex flex-col items-center justify-center gap-2 overflow-hidden transition-all",
                          "hover:border-zinc-400 dark:hover:border-zinc-500",
                          logoData
                            ? "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
                        )}
                      >
                        {logoData ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoData}
                            alt="Logo"
                            className="w-full h-full object-contain p-4"
                          />
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-zinc-500" />
                            </div>
                            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                              Subir logo
                            </span>
                            <span className="text-[10px] text-zinc-400 px-4 text-center">
                              PNG, JPG, WEBP o SVG
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
                      <div className="flex flex-col gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl h-9 text-xs w-full"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          {logoData ? "Cambiar archivo" : "Seleccionar archivo"}
                        </Button>
                        {logoData && (
                          <button
                            type="button"
                            onClick={() => setLogoData(null)}
                            className="text-[11px] text-zinc-500 hover:text-red-500 text-center py-1"
                          >
                            Quitar logo
                          </button>
                        )}
                        <p className="text-[10px] text-zinc-400 text-center">
                          Máximo 1.5 MB
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Logo en las generaciones
                        </Label>
                        <p className="text-[12px] text-zinc-500 mt-1 mb-3">
                          Define si el logo debe aparecer en las imágenes y en
                          qué posición por defecto.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {LOGO_MODE_OPTIONS.map((opt) => {
                            const active = logoMode === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setLogoMode(opt.id)}
                                className={cn(
                                  "text-left rounded-xl border px-3.5 py-3 transition-all",
                                  active
                                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900/[0.04] dark:bg-white/[0.06] ring-1 ring-zinc-900/15 dark:ring-white/15"
                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                                    {opt.label}
                                  </span>
                                  {active && (
                                    <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 px-4 py-3">
                        <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          Podrás cambiar esta opción cada vez que generes una
                          imagen desde la barra de contexto de Flow. El logo no
                          es obligatorio para continuar.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Products */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-zinc-500" />
                          Productos
                        </Label>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Nombre y URL de cada producto para analizar y generar
                          con contexto.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addProduct}
                        className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-3 h-3" /> Agregar
                      </button>
                    </div>

                    {products.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 py-10 flex flex-col items-center text-center px-4">
                        <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                          <Package className="w-5 h-5 text-zinc-400" />
                        </div>
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Sin productos todavía
                        </p>
                        <p className="text-[12px] text-zinc-400 mt-1 max-w-sm">
                          Opcional, pero recomendado si vendes o ofreces varios
                          ítems.
                        </p>
                        <button
                          type="button"
                          onClick={addProduct}
                          className="mt-4 text-[12px] font-bold text-zinc-900 dark:text-zinc-100 underline underline-offset-4"
                        >
                          Agregar el primero
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {products.map((p, idx) => (
                          <div
                            key={p.clientId}
                            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2.5 bg-zinc-50/40 dark:bg-zinc-900/30"
                          >
                            <div className="flex gap-2 items-center">
                              <span className="text-[10px] font-black text-zinc-400 w-5 shrink-0">
                                {idx + 1}
                              </span>
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
                                className="rounded-lg h-9 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setProducts((list) =>
                                    list.filter((_, i) => i !== idx)
                                  )
                                }
                                className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2 pl-7">
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Extra pages */}
                  <div className="space-y-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between gap-3 pt-4">
                      <div>
                        <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-zinc-500" />
                          Páginas adicionales
                        </Label>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Catálogo, sobre nosotros, colecciones, etc.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addPage}
                        className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Página
                      </button>
                    </div>

                    {pages.length > 0 && (
                      <div className="space-y-2">
                        {pages.map((p, idx) => (
                          <div
                            key={p.clientId}
                            className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
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
                              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background text-xs px-2 sm:w-[110px]"
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
                              className="rounded-lg h-9 text-sm flex-1"
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
                              className="rounded-lg h-9 text-sm flex-[1.4]"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setPages((list) =>
                                  list.filter((_, i) => i !== idx)
                                )
                              }
                              className="p-2 rounded-lg text-zinc-400 hover:text-red-500 self-end sm:self-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-zinc-400">
                      URLs a analizar:{" "}
                      <span className="font-bold text-zinc-600 dark:text-zinc-300">
                        {countUrls()}
                      </span>{" "}
                      / {MAX_BRAND_URLS}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 px-6 sm:px-8 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex gap-2">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-10 px-4"
                  onClick={goBack}
                  disabled={busy}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Atrás
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl h-10 px-4 text-zinc-500"
                  onClick={closeForm}
                  disabled={busy}
                >
                  Cancelar
                </Button>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:items-center">
              {step < 3 ? (
                <Button
                  type="button"
                  className="rounded-xl h-10 px-5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900"
                  onClick={goNext}
                  disabled={busy}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl h-10 px-4"
                    onClick={handleSave}
                    disabled={busy}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl h-10 px-5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold"
                    onClick={handleUnderstand}
                    disabled={busy}
                  >
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Entender marca con IA
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

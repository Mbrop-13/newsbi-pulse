"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-8"
        >
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </motion.div>

        <h1 className="font-editorial text-2xl md:text-3xl font-bold mb-3">
          Algo salió mal
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          Ocurrió un error inesperado al cargar esta página. Puedes intentar recargar o volver al inicio.
        </p>

        <div className="flex items-center gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 rounded-xl h-11 px-6 shadow-lg shadow-accent/20"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </Button>
          <Link href="/">
            <Button variant="outline" className="gap-2 rounded-xl h-11 px-6 border-border">
              <Home className="w-4 h-4" />
              Inicio
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

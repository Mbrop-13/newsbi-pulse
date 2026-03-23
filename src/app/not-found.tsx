"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <span className="font-editorial text-[120px] md:text-[160px] font-black leading-none gradient-text">
              404
            </span>
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -right-4"
            >
              <FileQuestion className="w-10 h-10 text-accent" />
            </motion.div>
          </div>
        </motion.div>

        {/* Text */}
        <h1 className="font-editorial text-2xl md:text-3xl font-bold mb-3">
          Página no encontrada
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          La página que buscas no existe o ha sido movida. Vuelve al inicio para
          seguir leyendo las noticias más recientes.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-center">
          <Link href="/">
            <Button className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 rounded-xl h-11 px-6 shadow-lg shadow-accent/20">
              <Home className="w-4 h-4" />
              Ir al inicio
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2 rounded-xl h-11 px-6 border-border"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

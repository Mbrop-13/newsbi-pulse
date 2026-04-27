"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { Separator } from "@/components/ui/separator";
import { Github, Twitter, Linkedin, Mail, ExternalLink } from "lucide-react";
import { NewsletterForm } from "./newsletter-form";

export function Footer() {
  return (
    <footer className="border-t border-border mt-16 hidden md:block">
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-10 md:gap-20">
          {/* Brand */}
          <div className="md:w-[240px] shrink-0">
            <Logo showText={false} size="lg" className="-ml-1" />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Plataforma de noticias impulsada por IA. Análisis inteligente,
              verificación y audio profesional.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <a href="https://github.com" className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="mailto:info@reclu.com" className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link Columns — pushed right */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

          {/* Secciones */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-foreground">Secciones</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Principal</Link></li>
              <li><Link href="/finanzas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Finanzas</Link></li>
              <li><Link href="/inversiones" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Inversiones</Link></li>
              <li><Link href="/economia" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Economía</Link></li>
              <li><Link href="/tech-global" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tech Global</Link></li>
              <li><Link href="/impacto-global" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Impacto Global</Link></li>
            </ul>
          </div>

          {/* Explorar */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-foreground">Explorar</h4>
            <ul className="space-y-2">
              <li><Link href="/tendencia" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tendencia</Link></li>
              <li><Link href="/breaking" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Breaking</Link></li>
              <li><Link href="/mercados" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mercados</Link></li>
              <li><Link href="/predicciones" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Predicciones</Link></li>
              <li><Link href="/mundo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mundo</Link></li>
              <li><Link href="/asistente" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Asistente IA</Link></li>
            </ul>
          </div>

          {/* Tu Cuenta */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-foreground">Tu Cuenta</h4>
            <ul className="space-y-2">
              <li><Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mi Perfil</Link></li>
              <li><Link href="/guardados" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Guardados</Link></li>
              <li><Link href="/lista-lectura" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Lista de Lectura</Link></li>
              <li><Link href="/suscripcion" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Suscripción Premium</Link></li>
              <li>
                <a
                  href="https://reclu.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  reclu.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacidad" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Política de Privacidad</Link></li>
            </ul>
          </div>

          </div>{/* end link columns wrapper */}
        </div>{/* end main flex row */}

          {/* Newsletter */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="max-w-xs">
              <NewsletterForm variant="footer" />
            </div>
          </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Reclu by{" "}
            <a href="https://reclu.com" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
              Reclu
            </a>
            . Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Hecho con ❤️ en Chile 🇨🇱
          </p>
        </div>
      </div>
    </footer>
  );
}

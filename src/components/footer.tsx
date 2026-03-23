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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Logo />
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
              <a href="mailto:info@programbi.com" className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Secciones */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-foreground">Secciones</h4>
            <ul className="space-y-2">
              {["Inicio", "Tecnología", "Negocios", "Chile", "En Vivo"].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tecnología */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-foreground">Tecnología</h4>
            <ul className="space-y-2">
              {["Grok AI (xAI)", "NewsData.io", "Supabase", "Next.js 15"].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ProgramBI */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-foreground">ProgramBI</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://programbi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  programbi.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacidad</Link></li>
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Términos</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4 mt-4 pt-6 border-t border-border">
            <div className="max-w-xs">
              <NewsletterForm variant="footer" />
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NewsBI Pulse by{" "}
            <a href="https://programbi.com" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
              ProgramBI
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

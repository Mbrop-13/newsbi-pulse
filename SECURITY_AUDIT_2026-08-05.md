# Auditoría de Ciberseguridad — Maverlang (newsbi-pulse)

| Campo | Valor |
|---|---|
| **Fecha** | 2026-08-05 |
| **Alcance** | App Next.js (App Router) + Supabase (Auth/Postgres/RLS) + Vercel (hosting, crons, envs) |
| **Marco** | OWASP ASVS 4.0 (L2 objetivo, L3 aspiracional) · OWASP Top 10 2021 · CIS · CWE |
| **Metodología** | Revisión estática de código (`src/`, `*.sql`, `next.config`, `vercel.json`), revalidación de la auditoría ASVS L3 del 2026-06-28, superficie de API (~64 rutas), secretos locales, `npm audit` |
| **Clasificación** | Confidencial — solo equipo interno |

---

## 1. Resumen ejecutivo

La plataforma ha **mejorado de forma material** respecto a la auditoría de junio 2026. Varios hallazgos **críticos** (webhook MercadoPago sin firma, chat IA anónimo con service-role, IDOR de chats, Python sin allowlist, open redirect en OAuth) **están remedidos en código**.

La postura actual es **aceptable para un producto en crecimiento, pero aún no cumple un estándar de alta garantía (ASVS L2 completo)**. Los riesgos residuales más importantes son:

1. **Abuso económico de Flow** (créditos de imagen solo en cliente; sin control server-side en BD).
2. **Secretos de producción en disco** (`.env.local` en carpeta OneDrive) — superficie de robo de claves.
3. **Dependencia de que las migraciones RLS/RPC se hayan aplicado en el proyecto Supabase real** (solo hay SQL en repo; no hay evidencia runtime).
4. **Rate-limit fail-open / en memoria** si Upstash Redis no está bien configurado en Vercel.
5. **CSP permisiva** (`unsafe-inline` + `unsafe-eval`) y builds que ignoran errores TS/ESLint.
6. **CVEs en dependencias** (`npm audit`: varios **high** en cadena AI SDK, Hono, DOMPurify, etc.).

| Severidad | Abiertos (2026-08) | Notas |
|---|---:|---|
| 🔴 Crítico | **2** | Secretos en disco + abuso Flow/coste OpenRouter |
| 🟠 Alto | **7** | RLS no verificada en prod, rate-limit, admin solo client, guest AI, CSP, npm high, MP dataId |
| 🟡 Medio | **9** | SSRF residual DNS rebinding, ignoreBuildErrors, payloads grandes, IP_HASH_SALT, etc. |
| 🟢 Bajo / Informativo | **5** | Hardening adicional |
| **TOTAL abiertos** | **~23** | |
| Remedios confirmados desde jun-2026 | **≥12** | Ver §3 |

**Postura global:** **MEJORADA / MODERADA** — ya no es “deficiente con RCE/escalada trivial de pagos”, pero **no es producción hardened** sin cerrar los 2 críticos y verificar RLS en Supabase.

---

## 2. Superficie de ataque

```
┌─────────────┐     HTTPS      ┌──────────────┐     JWT/cookies    ┌────────────┐
│  Navegador  │ ─────────────► │   Vercel     │ ─────────────────► │  Supabase  │
│  (Next.js)  │ ◄───────────── │  Edge+Node   │ ◄───────────────── │ Auth + DB  │
└─────────────┘                └──────┬───────┘                    └────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              OpenRouter/xAI    MercadoPago       Upstash Redis
              YouTube/NewsData  Azure Email       GitHub PAT
              Browser sandbox   Listmonk          AWS (si aplica)
```

### 2.1 Entradas relevantes

| Superficie | Rutas / componentes | Riesgo principal |
|---|---|---|
| API pública / semi | `/api/ai-chat`, `/api/newsletter`, `/api/csp-report`, webhooks | Abuso coste, spam, DoS |
| API autenticada | `/api/flow`, `/api/run-python`, `/api/chat/*`, empresas, finance | Authz, IDOR, cuota |
| API admin | `/api/admin/*`, `/api/github/dispatch`, news fetch/enrich | Escalada de privilegios |
| Webhooks / cron | `/api/webhooks/mercadopago`, `/api/cron`, `/api/cron/email-automation` | Escalada de tier, email blast |
| Cliente Supabase (anon) | Portafolio, alertas, chats, preferences | RLS bypass si mal configurado |
| Service role | Muchas rutas server | Blast radius total si se filtra la key |
| OAuth | `/auth/callback`, Google Drive | Open redirect, token theft |
| Contenido renderizado | Canvas/WebBuilder, artículos, share | XSS |

### 2.2 Activos sensibles

- `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS total)
- `OPENROUTER_API_KEY` / LLM keys (coste $)
- `MERCADOPAGO_ACCESS_TOKEN` + `MERCADOPAGO_WEBHOOK_SECRET`
- `GITHUB_PAT`, AWS keys (si siguen en uso)
- Datos de usuario: emails, chats IA, portafolio, org enterprise

---

## 3. Revalidación de la auditoría 2026-06-28

| ID antiguo | Título | Estado 2026-08 |
|---|---|---|
| C-1 | Secretos en `.env.local` | ⚠️ **Sigue abierto** (claves presentes en disco / OneDrive) |
| C-2 | `/api/ai/chat` anónimo + service-role | ✅ **Remediado** — `requireUser()` + rate limit |
| C-3 | Middleware no protege `/api` (deny-by-default) | ⚠️ **Parcial** — cada ruta se autoprotege; no hay deny-by-default global |
| C-4 | RPC `SECURITY DEFINER` sin `auth.uid` / search_path | ✅ **Remediado en SQL repo** — **verificar aplicado en Supabase** |
| C-5 | Webhook MP sin firma | ✅ **Remediado** — HMAC + reject si falta secret |
| C-6 | Python arbitrario | ✅ **Remediado** — auth, allowlist, forbid list, rate limit |
| A-1 | IDOR chat API | ✅ **Remediado** — ownership check |
| A-2 | Share/chat ownership | ✅ **Mejorado** — revocación/expiración + service read acotado |
| A-3 | RLS `USING (true)` | ⚠️ **SQL de remediación en repo** — **no verificado en prod** |
| A-5 | SSRF browser | ✅ **Remediado** — `assertSafeFetchUrl` |
| A-6 | Portfolio financial writes | ✅ **Parcial** — existe `/api/portfolio/update`; insert/delete aún desde cliente |
| A-8 | XSS `dangerouslySetInnerHTML` | ✅ **Parcial** — canvas usa `sanitizeHtml`; JSON-LD y demos residuales |
| Open redirect OAuth | — | ✅ **Remediado** — path relative + host allowlist |

---

## 4. Hallazgos abiertos (detalle)

### 🔴 C-2026-08-01 · Secretos de producción en texto plano (disco / OneDrive)

- **ASVS:** 6.4.1, 7.1.1 · **CWE-798 / CWE-312**
- **Evidencia:** Existe `.env.local` con nombres de variables: `OPENROUTER_API_KEY`, `AWS_SECRET_ACCESS_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_PAT`, `MERCADOPAGO_ACCESS_TOKEN`, etc. El workspace vive bajo `OneDrive\Desktop\...` → sync cloud + backups locales.
- **Impacto:** Compromiso total de BD (service_role), pagos, LLM billing, CI.
- **Remediación:**
  1. **Rotar todas las claves** (asumir exposición).
  2. Mover secretos solo a **Vercel Environment Variables** (+ Supabase secrets); no copiar prod a OneDrive.
  3. `.env.local` solo con valores de **dev** / anon keys.
  4. Pre-commit: `gitleaks` / `trufflehog`.
  5. Quitar el proyecto de sync OneDrive o excluir `.env*`.

---

### 🔴 C-2026-08-02 · Flow: cuotas de imagen solo en cliente (abuso de coste)

- **ASVS:** 4.1.1, 4.2.1, 11.1.4 · **CWE-639 / CWE-770**
- **Evidencia:**
  - Cliente: `incrementImageCreditsUsed` en Zustand (`subscription-store`) — **no es fuente de verdad**.
  - API `/api/flow`: auth + rate limit 20/h, **sin** chequeo de plan/créditos en BD, **sin** decremento server-side.
  - Free plan: `imageCreditsPerMonth: 0` en config, pero un usuario free autenticado puede llamar la API y generar imágenes (coste OpenRouter) si bypasea el UI.
- **Impacto:** Drain económico de API keys; usuarios free/pro superan cuotas reales.
- **Remediación:**
  1. Tabla `monthly_image_usage` (o columna en `monthly_usage`) con RLS + RPC `SECURITY DEFINER`.
  2. En `/api/flow`: leer tier server-side, verificar saldo **antes** de generar, incrementar **después** de éxito (transacción / RPC atómico).
  3. Rechazar free con 0 créditos en servidor.
  4. Límite de tamaño de `prompt` y `referenceImages` (base64) para anti-DoS.

---

### 🟠 A-2026-08-01 · Estado real de RLS/RPC en Supabase no verificado

- **Evidencia:** Existen `supabase-rls-remediation.sql`, `supabase-rpc-functions.sql`, hardening enterprise — pero la auditoría es solo de código.
- **Riesgo residual:** Si prod no aplicó el SQL, siguen fugas de `profiles`, enumeración de `shared_chat_links`, etc.
- **Remediación (operativa, prioritaria):**
  ```sql
  -- En Supabase SQL Editor (prod):
  SELECT tablename, policyname, qual, with_check
  FROM pg_policies WHERE schemaname = 'public'
  ORDER BY tablename;
  ```
  Confirmar: no hay `USING (true)` en tablas con PII; RPC con `search_path` y `auth.uid()`.

---

### 🟠 A-2026-08-02 · Rate limiting débil en serverless sin Redis

- **Código:** `src/lib/rate-limit.ts` — sin Upstash → in-memory (por instancia); en prod serverless loguea warning y sigue.
- **Impacto:** Bypass de límites de IA, Flow, Python, newsletter repartiendo carga entre lambdas.
- **Remediación:** Obligatoriedad de `UPSTASH_REDIS_REST_*` en Vercel prod; healthcheck al arranque que falle el deploy si faltan (o fail-closed en endpoints caros).

---

### 🟠 A-2026-08-03 · Panel `/admin` protegido solo en cliente

- **Código:** `src/app/admin/layout.tsx` — `fetch("/api/admin/verify")` client-side.
- **Mitigación actual:** APIs admin revalidan admin en servidor (bien).
- **Riesgo residual:** Fuga de bundle/UI admin, posibles data-fetch client mal protegidos, UX de seguridad débil.
- **Remediación:** Middleware o Server Layout con `requireAdmin()`; no confiar en redirect client.

---

### 🟠 A-2026-08-04 · Chat IA invitado (`guest-IP`) sigue expuesto a abuso de coste

- **Código:** `src/app/api/ai-chat/route.ts` — permite `userId = guest-${ip}` con límites de tokens.
- **Riesgo:** Rotación de IP / proxies → coste LLM. Rate limit por IP es frágil.
- **Remediación:** CAPTCHA (hCaptcha ya está en CSP) en guest; límites más agresivos; o exigir auth para tools caros (browser, webBuilder, pro model).

---

### 🟠 A-2026-08-05 · CSP con `unsafe-inline` + `unsafe-eval`

- **Código:** `next.config.ts` headers.
- **Impacto:** Mitigación XSS débil; un XSS gana ejecución de scripts.
- **Remediación:** Nonces por request; aislar preview WebBuilder en subdominio sandbox (`preview.maverlang.cl`) sin cookies de sesión; quitar `unsafe-eval` del origen principal.

---

### 🟠 A-2026-08-06 · Firma MercadoPago: `data.id` desde header incorrecto

- **Código:** `webhooks/mercadopago/route.ts` usa `request.headers.get("x-data-id")`.
- **Especificación MP:** el manifest usa el `data.id` de la notificación (body/query), no un header estándar `x-data-id`.
- **Impacto:** (1) Webhooks reales pueden fallar → ops desactiva secret; (2) manifest incorrecto debilita la defensa.
- **Remediación:** Parsear body **después** de leer raw text; usar `body.data.id` (y query `data.id` si aplica) en el manifest; opcional anti-replay con ventana de `ts`.

---

### 🟠 A-2026-08-07 · Dependencias con CVEs high (`npm audit`)

- Cadena `@ai-sdk/*` / `ai` — Uncontrolled Resource Consumption.
- `dompurify` — bypass de sanitización en custom elements.
- Varios en `hono` (si transitivo), `ip-address` (SSRF octal), etc.
- **Remediación:** Actualizar dependencias con plan de breaking changes; `npm audit fix` controlado; pin + Dependabot/Renovate.

---

### 🟡 M-2026-08-01 · `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds`

- **Impacto:** Código inseguro o roto puede desplegarse.
- **Fix:** Quitar flags; CI que falle en typecheck + lint + tests de authz.

---

### 🟡 M-2026-08-02 · `createServiceClient` no falla si falta la key

- **Código:** `src/lib/supabase.ts` — `SERVICE_ROLE_KEY || ""`.
- **Fix:** Throw en producción si falta; nunca construir cliente vacío.

---

### 🟡 M-2026-08-03 · SSRF residual (DNS rebinding / TOCTOU)

- `assertSafeFetchUrl` resuelve DNS y luego el fetch puede resolver otra IP.
- **Fix:** Pin de IP en el cliente HTTP, o proxy egress con deny privado, re-check en connect.

---

### 🟡 M-2026-08-04 · Payloads grandes en Flow (`referenceImages` base64, logo)

- Hasta 4 data-URLs sin tope de bytes en la API → memoria/timeout/coste.
- **Fix:** Max 1.5MB por imagen; rechazar si `Content-Length` > N.

---

### 🟡 M-2026-08-05 · `IP_HASH_SALT` por defecto inseguro

- **Código:** `src/lib/ip-hash.ts` — salt hardcodeado si falta env.
- **Fix:** Exigir `IP_HASH_SALT` en prod.

---

### 🟡 M-2026-08-06 · Escrituras directas de cliente a `portfolios` (insert/delete)

- Aún en `portfolio-client`, `mercados/page`, etc.
- **Riesgo:** Depende 100% de RLS; columnas no validadas server-side.
- **Fix:** Centralizar mutaciones en API + políticas RLS estrictas (solo columnas permitidas).

---

### 🟡 M-2026-08-07 · Créditos de imagen / tier en stores client (confianza UI)

- `subscription-store` y `auth-store.tier` pueden ser optimistas; la verdad debe ser server.
- **Fix:** Siempre revalidar en API (ya se hace para AI tokens; falta Flow).

---

### 🟡 M-2026-08-08 · Cron Vercel + `CRON_SECRET`

- `vercel.json` invoca `/api/cron` y `/api/cron/email-automation`.
- Debe existir `CRON_SECRET` en Vercel y Authorization correcta (Vercel inyecta Bearer si se configura).
- **Verificar** en dashboard que no se pueda invocar el cron sin secret desde Internet.

---

### 🟡 M-2026-08-09 · Prompt injection detection es keyword-based

- Fácil de bypassear; no es control de seguridad fuerte.
- **Aceptar como defense-in-depth** + separación de datos/instrucciones en el prompt del modelo.

---

### 🟢 Bajos / informativos

| ID | Tema | Nota |
|---|---|---|
| B1 | `service_role` en muchas rutas | Necesario a veces; minimizar y auditar cada uso |
| B2 | Logs con muestras de prompt injection | Cuidado con PII en logs Vercel |
| B3 | Share links enumerables (UUID) | UUID v4 OK; rate-limit lectura pública |
| B4 | Capacitor / Android app | Superficie móvil aparte (storage, WebView, deep links) |
| B5 | `connect-src` amplio (wss, CDNs) | Revisar necesidad periódica |

---

## 5. Controles positivos observados

1. **Auth helpers** centralizados (`requireUser`, `requireAdmin`).
2. **Webhook MP** con HMAC + fail-closed si no hay secret.
3. **URL guard SSRF** en browser tools y brand analysis.
4. **Python sandbox** hardenizado (allowlist + patrones de escape + rate limit).
5. **Headers de seguridad** (HSTS, nosniff, frame-ancestors, CSP report).
6. **Borrado de cuenta** con re-autenticación (password o token).
7. **Share chat** con revocación/expiración.
8. **Open redirect** mitigado en OAuth callback.
9. **Sanitización DOMPurify** en canvas WebBuilder.
10. **Enterprise invitations** con validación de email del invitante.
11. **Zod** en varias mutaciones sensibles (share, portfolio update, delete, python).

---

## 6. Checklist Supabase (operaciones)

Ejecutar en el proyecto **producción** y archivar evidencia:

- [ ] RLS **ON** en todas las tablas de usuario
- [ ] Ninguna policy `USING (true)` en `profiles`, `subscriptions`, `ai_saved_chats`, `portfolios`, `organization_*`
- [ ] RPC de usage: `SET search_path = public, pg_temp` + `auth.uid()`
- [ ] `service_role` no embebida en cliente (solo server)
- [ ] Auth: confirmar email, password policy, MFA para admins (recomendado)
- [ ] Storage buckets: no públicos si hay logos/base64 de marca
- [ ] API keys rotadas tras esta auditoría si `.env.local` estuvo en OneDrive

---

## 7. Checklist Vercel

- [ ] Env vars solo en dashboard; Preview ≠ Production secrets
- [ ] `CRON_SECRET`, `UPSTASH_*`, `IP_HASH_SALT`, `MERCADOPAGO_WEBHOOK_SECRET` presentes en Production
- [ ] Deployment Protection / SSO para previews si hay datos reales
- [ ] Logs sin secretos; alertas de 401/403 en webhooks y admin
- [ ] Función maxDuration acotada (ya parcialmente en `vercel.json`)
- [ ] Dominios allowlist alineados con auth callback

---

## 8. Plan de remediación priorizado

### P0 — esta semana

1. Rotar secretos expuestos en OneDrive / `.env.local`.
2. Server-side enforcement de créditos Flow + rechazo free sin cuota.
3. Verificar/aplicar SQL RLS + RPC en Supabase prod (export `pg_policies`).
4. Corregir `data.id` en firma MercadoPago + prueba de webhook sandbox.
5. Forzar Upstash Redis en production (o fail-closed en endpoints caros).

### P1 — 2–4 semanas

6. Middleware/server layout para `/admin`.
7. CAPTCHA + límites guest AI; opcional auth-only para tools caros.
8. Actualizar dependencias AI SDK / DOMPurify (plan de breaking changes).
9. Límites de payload Flow; validación zod estricta en `/api/flow`.
10. Quitar `ignoreBuildErrors` en CI.

### P2 — backlog de hardening

11. CSP con nonces + sandbox subdomain para preview.
12. Centralizar mutaciones portfolio en API.
13. Anti-DNS-rebinding en SSRF.
14. MFA admin + audit log de acciones admin.
15. Threat model formal + pentest externo anual.

---

## 9. Matriz de riesgo residual (post-P0 esperado)

| Escenario | Antes P0 | Después P0 |
|---|---|---|
| Escalada de suscripción vía webhook | Bajo (firma OK*) | Muy bajo |
| Robo service_role vía laptop/OneDrive | **Alto** | Bajo (si rotan) |
| Abuso generación de imágenes | **Alto** | Bajo |
| Fuga PII por RLS mal puesta | Medio–Alto (desconocido) | Bajo (verificado) |
| XSS → sesión | Medio (CSP laxa) | Medio (hasta nonces) |
| DoS de coste LLM guest | Medio | Bajo |

\*Sujeto a corrección de `data.id` en el manifest.

---

## 10. Limitaciones de esta auditoría

- **No** es un pentest dinámico ni un red team.
- **No** se accedió al dashboard Supabase/Vercel en vivo.
- **No** se ejecutaron pruebas de fuzzing ni exploits activos (política de seguridad del agente).
- Los SQL de remediación se evalúan como **intención de diseño**, no como estado de producción.
- Capacitor/Android y plantillas de email se revisaron superficialmente.

---

## 11. Conclusión

Maverlang ha pasado de un estado **crítico** (junio 2026) a uno **moderado** con buenos cimientos (auth en APIs clave, firma de pagos, SSRF guard, sandbox Python, ownership de chats).  

Para operar con confianza en producción con pagos reales y service_role:

1. **Cerrar secretos + rotación**  
2. **Cuotas Flow en servidor**  
3. **Evidencia de RLS en Supabase**  
4. **Rate-limit distribuido real**  
5. **Pipeline de dependencias y builds sin ignore-errors**

---

*Documento generado por revisión estática de código — 2026-08-05. Recomendado: re-auditoría tras P0 y pentest externo en 90 días.*

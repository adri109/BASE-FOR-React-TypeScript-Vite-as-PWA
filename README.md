# app-template

Template de monorepo para una aplicación web offline-first con mapa interactivo, backend multi-tenant en Supabase y contenido versionado en Git. Está pensado para clonarse con **Use this template** y renombrarse; no es una librería.

Qué hay hoy en el código:

- PWA en React + TypeScript + Vite con una única pantalla: un mapa de anillos concéntricos de prueba, dibujado con PixiJS y acompañado de un equivalente DOM/ARIA (lista, filtros, detalle).
- Paquete `shared` con taxonomía, esquemas zod del contenido, validación cruzada y layout polar del mapa.
- Esquema Postgres con RLS para academias, membresías, clases y eventos de aprendizaje, más tests pgTAP de aislamiento entre academias.
- Contenido de ejemplo en YAML con JSON Schema generado y pipeline que lo valida y lo empaqueta en JSON para el cliente.
- CI (format, lint, typecheck, contenido, tests, build, E2E, tests de base de datos) y despliegue opcional a Cloudflare Pages.

Qué **no** hay: autenticación en la UI, motor de ejercicios, repaso espaciado, sincronización offline, Edge Functions ni Classroom. Son trabajo posterior; el esquema y la estructura de carpetas ya los contemplan.

## Contenido

```
.
├── apps/
│   └── web/                      # Cliente: React 19 + Vite 8, PWA (vite-plugin-pwa)
│       ├── e2e/                  # Playwright (proyectos desktop y mobile)
│       ├── public/               # favicon, iconos PWA, _headers de Cloudflare Pages
│       ├── scripts/              # generate-icons.mjs (iconos placeholder sin dependencias)
│       └── src/
│           ├── lib/supabase.ts   # Cliente Supabase; null si faltan VITE_SUPABASE_*
│           ├── map/              # MapScreen (React), renderer.ts (PixiJS), NodeList (capa ARIA),
│           │                     # loadMap (paquete de contenido o mapa demo), palette
│           └── styles/app.css    # Responsive: <640 / 640–1024 / >1024 px
├── packages/
│   └── shared/                   # TS puro, sin dependencias de DOM ni de Node
│       └── src/
│           ├── taxonomy.ts       # Niveles (A1–C2) y ramas
│           ├── content-schema.ts # Esquemas zod: tema, ejercicios, paquete de mapa
│           ├── content-validate.ts # Reglas entre ficheros (ids, prerrequisitos, ciclos)
│           └── map.ts            # Tipos del mapa, layoutPolar(), createDemoMap()
├── tools/
│   └── content-build/            # CLI: validate | schema | build (script `emit`)
├── content/
│   ├── themes/<id>/{theme,exercises}.yaml   # Contenido fuente
│   └── schema/*.schema.json      # Generado desde zod; se commitea
├── supabase/
│   ├── config.toml               # Stack local (puertos 54321–54324, Postgres 17)
│   ├── migrations/               # 0000 esquema, 0100 RLS y funciones auxiliares
│   ├── tests/rls.test.sql        # pgTAP: 24 aserciones de aislamiento
│   └── seed.sql                  # Academia demo (sin usuarios)
├── docs/adr/                     # Decisiones técnicas (ADR cortos)
├── .github/
│   ├── workflows/{ci,deploy,db-push}.yml
│   ├── ISSUE_TEMPLATE/, PULL_REQUEST_TEMPLATE.md, dependabot.yml
├── eslint.config.js              # Flat config, TS + React Hooks
├── tsconfig.base.json            # strict, noUncheckedIndexedAccess, bundler resolution
├── pnpm-workspace.yaml
├── .nvmrc  .editorconfig  .prettierrc.json  .env.example  .gitignore  LICENSE
```

## Decisiones de stack

| Elemento              | Elección                                                    | Motivo                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gestor y monorepo     | pnpm workspaces                                             | Lockfile estricto, instalación rápida, sin capa extra (Turborepo/Nx) hasta que haya tiempos de build que lo justifiquen.                                                 |
| Cliente               | React + TypeScript + Vite                                   | Tipado completo y HMR rápido; Vite es la base de `vite-plugin-pwa` y de Vitest.                                                                                          |
| PWA                   | `vite-plugin-pwa` (Workbox, `generateSW`)                   | Precache del shell y `StaleWhileRevalidate` para `/content/*`. Sin tiendas de apps en esta etapa.                                                                        |
| Mapa                  | PixiJS 8 (WebGL) + capa DOM/ARIA                            | Cientos de nodos con pan/zoom fluido en móvil; SVG/DOM degrada con ese volumen. El canvas está `aria-hidden`; la lista es la interfaz accesible y el fallback sin WebGL. |
| Render                | Bajo demanda (sin ticker continuo)                          | Solo se repinta tras pan, zoom, resize o cambio de datos; menos batería.                                                                                                 |
| Modelo del mapa       | `layoutPolar()` en `shared`, independiente del renderizador | Se prueba sin gráficos y permite cambiar de renderizador.                                                                                                                |
| Backend               | Supabase (Postgres + Auth + RLS)                            | Multi-tenant por RLS sin servidor propio; SQL estándar, portable.                                                                                                        |
| Esquemas de contenido | zod 4 → JSON Schema (`z.toJSONSchema`)                      | Una sola fuente de verdad para validación en CI y autocompletado en el editor.                                                                                           |
| Contenido             | YAML en Git, un tema por carpeta                            | Revisión por PR, historial, sin CMS.                                                                                                                                     |
| Tests                 | Vitest (unitarios), Playwright (E2E), pgTAP (RLS)           | Cada capa se prueba en su nivel; las políticas RLS se prueban en la base de datos real.                                                                                  |
| Hosting               | Cloudflare Pages (estático)                                 | Sin coste fijo, CDN incluido. Despliegue opcional por workflow.                                                                                                          |
| TypeScript            | `~6.0`                                                      | `typescript-eslint` declara soporte `<6.1.0`; subir cuando lo amplíe.                                                                                                    |

## Requisitos

| Herramienta        | Versión                                                                 | Notas                                                                                                    |
| ------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Node.js            | ≥ 22.12 (ver `.nvmrc`)                                                  | Requisito de Vite 8.                                                                                     |
| pnpm               | ≥ 10 (fijado en `packageManager`: 10.33.4)                              | Con Corepack: `corepack enable`.                                                                         |
| Docker             | Cualquier runtime compatible (Docker Desktop, OrbStack, Colima, Podman) | Solo para la base de datos local (`pnpm db:*`). El cliente y los tests de TS no lo necesitan.            |
| Supabase CLI       | 3.x                                                                     | Se instala como `devDependency`; los scripts `db:*` usan la copia local. No requiere instalación global. |
| Navegador para E2E | Chromium vía Playwright                                                 | `pnpm --filter @app/web exec playwright install chromium`.                                               |

## Instalación

```bash
# 1. Crear el repo desde la template (ver "Usar como template") y clonarlo
git clone <url-del-repo> mi-proyecto && cd mi-proyecto

# 2. Node y pnpm
nvm use            # o fnm use / asdf install
corepack enable

# 3. Dependencias
pnpm install

# 4. Variables de entorno (ver siguiente sección)
cp .env.example apps/web/.env.local

# 5. Paquetes de contenido (genera apps/web/public/content, que no se commitea)
pnpm content:build

# 6. Arrancar el cliente
pnpm dev           # http://localhost:5173
```

Sin `VITE_SUPABASE_*` la app arranca igualmente (cabecera: "Backend: sin configurar"). Para el backend local, ver [Base de datos local](#base-de-datos-local-y-migraciones).

### Renombrar el proyecto

1. Sustituir `app-template` en `package.json` (raíz) y `project_id` en `supabase/config.toml`.
2. Si se cambia el scope `@app/*`: buscar y reemplazar en `package.json` de cada paquete, imports y scripts `--filter`.
3. Editar `name`, `short_name`, `description` del manifest en `apps/web/vite.config.ts`, `<title>` en `apps/web/index.html` y los iconos (`public/icons`, regenerables con `pnpm --filter @app/web icons`).
4. Sustituir `LICENSE` (contiene un placeholder).
5. Sustituir los datos de `content/` y la taxonomía de `packages/shared/src/taxonomy.ts` si no usa niveles CEFR.
6. Regenerar el lockfile tras cambios de nombres: `pnpm install`.

## Variables de entorno

Plantilla en `.env.example`. El cliente lee `apps/web/.env.local` (ignorado por Git). Vite solo expone al bundle las variables con prefijo `VITE_`.

| Variable                                                                    | Dónde         | Descripción                                                                                                  |
| --------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`                                                         | cliente       | URL de la API. Local: `http://127.0.0.1:54321`.                                                              |
| `VITE_SUPABASE_ANON_KEY`                                                    | cliente       | Clave `anon`. Local: salida de `pnpm db:status`. Es pública por diseño; la protección es RLS.                |
| `VITE_APP_URL`                                                              | cliente       | URL pública, para redirecciones de auth.                                                                     |
| `VITE_BASE`                                                                 | build         | Ruta base si se sirve bajo subruta (por defecto `/`).                                                        |
| `SUPABASE_SERVICE_ROLE_KEY`                                                 | solo servidor | Bypasa RLS. **Nunca** en el cliente ni con prefijo `VITE_`. Para Edge Functions: `supabase/.env` (ignorado). |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT` | CI            | Ver [CI/CD y despliegue](#cicd-y-despliegue).                                                                |

## Scripts

Todos se ejecutan desde la raíz.

| Script                         | Acción                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `pnpm dev`                     | Servidor de desarrollo de `apps/web`.                                                                 |
| `pnpm build`                   | `content:build` y build de producción de `apps/web` (`tsc --noEmit && vite build`) → `apps/web/dist`. |
| `pnpm preview`                 | Sirve `apps/web/dist`.                                                                                |
| `pnpm lint` / `lint:fix`       | ESLint sobre todo el repo.                                                                            |
| `pnpm format` / `format:check` | Prettier (escribe / comprueba).                                                                       |
| `pnpm typecheck`               | `tsc --noEmit` en cada paquete.                                                                       |
| `pnpm test`                    | Vitest en todos los paquetes.                                                                         |
| `pnpm test:e2e`                | Playwright (construye y sirve con `vite preview` en el puerto 4173).                                  |
| `pnpm content:validate`        | Valida `content/` (esquema y reglas cruzadas).                                                        |
| `pnpm content:schema`          | Regenera `content/schema/*.schema.json` desde zod.                                                    |
| `pnpm content:schema:check`    | Falla si los JSON Schema commiteados no coinciden con zod.                                            |
| `pnpm content:build`           | Valida y genera `apps/web/public/content/` (`map.json` + un JSON por tema).                           |
| `pnpm db:start` / `db:stop`    | Levanta / detiene el stack local de Supabase.                                                         |
| `pnpm db:status`               | URLs y claves locales.                                                                                |
| `pnpm db:reset`                | Recrea la base local: migraciones + `seed.sql`.                                                       |
| `pnpm db:lint`                 | `supabase db lint` sobre el esquema local.                                                            |
| `pnpm db:test`                 | Tests pgTAP (`supabase/tests`).                                                                       |
| `pnpm db:migration <nombre>`   | Crea una migración vacía con timestamp.                                                               |
| `pnpm db:types`                | Genera tipos TS del esquema en `packages/shared/src/database.types.ts`.                               |
| `pnpm check`                   | Lo mismo que CI sin E2E ni base de datos: format, lint, typecheck, contenido, test, build.            |

## Base de datos local y migraciones

Requiere Docker en ejecución.

```bash
pnpm db:start      # primera vez: descarga imágenes; aplica migrations/ y seed.sql
pnpm db:status     # copiar API URL y anon key a apps/web/.env.local
```

Servicios locales: API `:54321`, Postgres `:54322`, Studio `:54323`, Inbucket (correo, magic links) `:54324`.

### Esquema

| Tabla                      | Contenido                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`                 | 1:1 con `auth.users`; se crea por trigger al registrarse.                                                                          |
| `academies`                | Tenant. Alta manual con service role; no hay política de insert/delete para clientes.                                              |
| `memberships`              | (academia, usuario, rol `student`/`teacher`/`admin`).                                                                              |
| `classes`, `class_members` | Clases con `join_code`; `class_members` referencia con FK compuestas a la clase y a la membresía de la misma academia.             |
| `learner_events`           | Registro inmutable (sin política de update/delete). `id` lo genera el cliente: reenvíos idempotentes con `ON CONFLICT DO NOTHING`. |

### Políticas RLS

- Funciones auxiliares `SECURITY DEFINER` en el esquema `private` (no expuesto por la API REST) para evitar recursión entre políticas.
- Alumno: solo su perfil, sus membresías, sus clases y sus eventos.
- Profesor: además, perfiles y eventos de los alumnos de **sus** clases.
- Admin de academia: todos los miembros y eventos de **su** academia; puede gestionar membresías y clases.
- `anon` no tiene privilegios sobre ninguna tabla.
- `join_class(code)` es una RPC que crea la membresía `student` si no existe y matricula en la clase.

### Flujo de migraciones

```bash
pnpm db:migration add_assignments   # crea supabase/migrations/<timestamp>_add_assignments.sql
# editar el SQL
pnpm db:reset                       # reaplica todo desde cero
pnpm db:test                        # RLS
pnpm db:lint
```

Reglas:

- Las migraciones aplicadas no se editan; se añade otra.
- Toda tabla con datos de alumnos lleva `academy_id`, `enable row level security` y un test de aislamiento en `supabase/tests/`.
- Revocar privilegios por defecto y conceder solo lo necesario (ver `20260101000100_rls_policies.sql`).
- Tras cambiar el esquema: `pnpm db:types`.

Los tests pgTAP crean sus fixtures dentro de una transacción que termina en `rollback`, y suplantan al usuario con `request.jwt.claims` y `set local role authenticated`.

Aplicar al proyecto remoto: workflow manual `db-push.yml` o, en local, `pnpm exec supabase link --project-ref <ref>` y `pnpm exec supabase db push`.

## Flujo de contenido

Estructura (detalle en `content/README.md`):

```
content/themes/b2-third-conditional/
  theme.yaml        # id, level, branch, title, summary, prerequisites, explanation, commonErrors
  exercises.yaml    # theme + exercises[]: multiple_choice | fill_blank | reorder
```

1. Crear la carpeta del tema con ambos ficheros. Las cabeceras `# yaml-language-server: $schema=...` dan autocompletado (extensión Red Hat YAML; `.vscode/settings.json` ya mapea los esquemas).
2. `pnpm content:validate`. Falla si hay claves desconocidas, ids duplicados, `id` distinto del nombre de carpeta, prerrequisitos inexistentes o cíclicos, temas sin ejercicios o `answer` fuera de rango.
3. Si se modifica un esquema en `packages/shared/src/content-schema.ts`: `pnpm content:schema` y commitear los JSON (CI comprueba que están al día).
4. `pnpm content:build` genera `apps/web/public/content/map.json` y `themes/<id>.json`. El cliente los carga en runtime (`loadMap.ts`); si no existen, usa un mapa demo. Estado inicial de cada nodo: `active` sin prerrequisitos, `locked` con ellos.

Parámetro de prueba: `/?nodes=600` fuerza un mapa ficticio de 600 nodos para medir rendimiento en dispositivos reales.

## Tests

| Nivel                                    | Herramienta                                        | Ubicación                           | Comando                                 |
| ---------------------------------------- | -------------------------------------------------- | ----------------------------------- | --------------------------------------- |
| Unitarios (layout, esquemas, validación) | Vitest                                             | `packages/shared/src/*.test.ts`     | `pnpm --filter @app/shared test`        |
| Pipeline de contenido                    | Vitest                                             | `tools/content-build/src/*.test.ts` | `pnpm --filter @app/content-build test` |
| Componentes y carga del mapa             | Vitest + Testing Library (jsdom)                   | `apps/web/src/**/*.test.tsx`        | `pnpm --filter @app/web test`           |
| E2E                                      | Playwright (Chromium; viewports desktop y Pixel 7) | `apps/web/e2e/`                     | `pnpm test:e2e`                         |
| RLS                                      | pgTAP                                              | `supabase/tests/`                   | `pnpm db:test`                          |

Notas:

- jsdom no tiene WebGL: el renderer de PixiJS no se instancia en los tests unitarios. La lógica del mapa vive en `shared` justamente para poder probarla.
- El E2E de canvas solo comprueba que el `<canvas>` existe o que aparece el aviso de falta de WebGL; no compara píxeles.
- El primer uso de Playwright requiere `pnpm --filter @app/web exec playwright install chromium` (en Linux, añadir `--with-deps`).
- Los E2E bloquean el service worker (`serviceWorkers: 'block'`).

## CI/CD y despliegue

### CI (`.github/workflows/ci.yml`)

Se ejecuta en cada push a `main` y en cada PR.

| Job        | Pasos                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check`    | `pnpm install --frozen-lockfile`, `format:check`, `lint`, `typecheck`, `content:validate` + `content:schema:check`, `test`, `build`; sube `apps/web/dist`. |
| `e2e`      | `content:build`, instala Chromium, `test:e2e`; sube el informe si falla.                                                                                   |
| `database` | `supabase db start`, `supabase db lint`, `supabase test db`.                                                                                               |

### Cloudflare Pages (opcional)

`deploy.yml` se ejecuta en push a `main` o manualmente, **solo si** la variable de repositorio `DEPLOY_CLOUDFLARE` vale `true`.

1. Crear el proyecto en Cloudflare Pages (modo "Direct Upload"; no conectar el repo, el despliegue lo hace Actions).
2. Crear un API token con permiso _Cloudflare Pages: Edit_ y copiar el Account ID.
3. En GitHub, _Settings → Secrets and variables → Actions_:
   - Secretos: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_SUPABASE_ANON_KEY`.
   - Variables: `DEPLOY_CLOUDFLARE=true`, `CLOUDFLARE_PAGES_PROJECT`, `VITE_SUPABASE_URL`, `VITE_APP_URL`.
4. Crear el entorno `production` (opcional: reglas de aprobación).

`apps/web/public/_headers` fija caché inmutable para `/assets/*` y `no-cache` para `sw.js` y el manifest. Cloudflare Pages sirve `index.html` como fallback SPA si no hay `404.html`.

### Supabase remoto

1. Crear el proyecto en [supabase.com](https://supabase.com) en una región UE (p. ej. Fráncfort) si los datos de usuarios así lo exigen.
2. Secretos de GitHub: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`. Variable: `SUPABASE_PROJECT_REF`.
3. Ejecutar manualmente el workflow _DB migrations (Supabase)_: hace `link`, `db push --dry-run` y `db push`.
4. En el panel de Auth: configurar `site_url` y las URLs de redirección con el dominio de Pages; `supabase/config.toml` solo afecta al entorno local.
5. Poner la URL y la clave `anon` del proyecto en las variables de Actions indicadas arriba.

Las academias se crean con service role (SQL editor o script); no hay alta por autoservicio.

## Usar como template en GitHub

1. En el repositorio original: _Settings → General → Template repository_ (marcar).
2. En la página del repo: **Use this template → Create a new repository**. Marcar "Include all branches" solo si hace falta.
3. En el repositorio nuevo:
   - Ejecutar la sección [Renombrar el proyecto](#renombrar-el-proyecto).
   - Configurar secretos y variables (ver [CI/CD](#cicd-y-despliegue)).
   - Proteger `main` (PR obligatorio y checks `check`, `e2e`, `database`).
   - Revisar `.github/dependabot.yml` y `LICENSE`.

El historial de commits no se copia; el nuevo repo empieza con un único commit.

## Troubleshooting

| Síntoma                                                   | Causa probable                                              | Solución                                                                                                       |
| --------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `ERR_PNPM_UNSUPPORTED_ENGINE` o fallo de Vite al arrancar | Node < 22.12                                                | `nvm use`; comprobar `node -v`.                                                                                |
| `pnpm: command not found` o versión distinta              | Corepack sin activar                                        | `corepack enable`; `pnpm -v` debe coincidir con `packageManager`.                                              |
| `Ignored build scripts` tras `pnpm install`               | pnpm 10 bloquea postinstall no listados                     | Añadir el paquete a `onlyBuiltDependencies` en `pnpm-workspace.yaml`. Ya están `esbuild` y `supabase`.         |
| `pnpm db:start`: `Cannot connect to the Docker daemon`    | Docker detenido                                             | Arrancar Docker; verificar con `docker ps`.                                                                    |
| `pnpm db:start`: puerto 54321–54324 ocupado               | Otro stack de Supabase                                      | `pnpm db:stop`, o cambiar los puertos en `supabase/config.toml`.                                               |
| `pnpm db:test` falla con `permission denied` inesperado   | Tabla nueva sin `grant` a `authenticated`                   | Añadir el `grant` mínimo en la migración (ver `20260101000100_rls_policies.sql`).                              |
| Consulta devuelve 0 filas sin error                       | RLS sin política aplicable                                  | Comprobar la política y que `auth.uid()` no es null (sesión).                                                  |
| Cabecera "Backend: sin configurar"                        | Faltan `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`       | Crear `apps/web/.env.local` y reiniciar `pnpm dev` (Vite solo lee `.env` al arrancar).                         |
| Mapa vacío o "Fuente: demo" con contenido existente       | No se generaron los paquetes                                | `pnpm content:build`.                                                                                          |
| Aviso "WebGL no disponible"                               | Navegador sin WebGL (headless, VM, aceleración desactivada) | Usar la lista de nodos o un navegador con aceleración.                                                         |
| Cambios no visibles tras desplegar                        | Service worker sirviendo versión antigua                    | Recargar dos veces (`registerType: 'autoUpdate'`); en DevTools → Application → Service Workers → _Unregister_. |
| `pnpm content:schema:check` / CI falla por esquemas       | Se cambió zod sin regenerar                                 | `pnpm content:schema` y commitear `content/schema/`.                                                           |
| Playwright: `Executable doesn't exist`                    | Navegador no instalado                                      | `pnpm --filter @app/web exec playwright install chromium`.                                                     |
| Playwright en Linux: faltan librerías                     | Dependencias del sistema                                    | Añadir `--with-deps` al comando anterior.                                                                      |

## Convenciones

### Ramas

- `main`: siempre desplegable, protegida; solo se cambia por PR.
- Ramas de trabajo: `<tipo>/<descripcion-corta-en-kebab>`, con `tipo` ∈ `feat`, `fix`, `content`, `db`, `chore`, `docs`, `refactor`, `test`. Ej.: `feat/class-join-flow`, `db/add-assignments`.
- Vida corta; rebase sobre `main` antes de abrir el PR; squash merge.

### Commits

[Conventional Commits](https://www.conventionalcommits.org/): `<tipo>(<ámbito>): <resumen en imperativo, ≤ 72 caracteres>`.

- Tipos: `feat`, `fix`, `content`, `db`, `perf`, `refactor`, `test`, `docs`, `build`, `ci`, `chore`.
- Ámbitos habituales: `web`, `map`, `shared`, `content`, `supabase`, `ci`, `deps`.
- Ejemplos: `feat(map): añadir zoom con pinch`, `db(supabase): política de lectura para profesores`, `content(b2): tema de mixed conditionals`.
- Cambios incompatibles: `!` tras el tipo (`feat(shared)!: ...`) y párrafo `BREAKING CHANGE:` en el cuerpo.

### Pull requests

- Rellenar la plantilla. Un PR, un cambio.
- `pnpm check` en local antes de abrir el PR.
- Todo cambio de UI se verifica en móvil (< 640 px), tablet (640–1024 px) y escritorio (> 1024 px): sin desbordes horizontales, objetivos táctiles ≥ 44 px, `prefers-reduced-motion` respetado.
- Cambios de esquema: migración nueva + test RLS; no editar migraciones ya aplicadas.
- Decisiones técnicas relevantes: ADR corto en `docs/adr/`.

### Estilo

Prettier (`.prettierrc.json`) y ESLint son la autoridad; `.editorconfig` fija LF, 2 espacios y UTF-8. Tests junto al código (`*.test.ts[x]`), E2E en `apps/web/e2e/`.

## Licencia

`LICENSE` es un placeholder: sustituirlo antes de publicar.

# BASE FOR: React, TypeScript y Vite as PWA

Plantilla de GitHub con una aplicación de una sola página en React 19, TypeScript y Vite, configurada como PWA (Progressive Web App) con `vite-plugin-pwa`. Es un único paquete, sin monorepo, con una pantalla de ejemplo y el tooling mínimo para trabajar con ella: ESLint, Prettier, Vitest, Testing Library, Playwright y CI en GitHub Actions.

No incluye router, gestor de estado global, librería de UI, backend ni base de datos. Cada uno se añade según el proyecto; las secciones [Añadir rutas](#añadir-rutas), [Estado](#estado) y [Estilos](#estilos) indican cómo.

## Contenido

- [Requisitos](#requisitos)
- [Usar la plantilla en GitHub](#usar-la-plantilla-en-github)
- [Instalar y ejecutar](#instalar-y-ejecutar)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Cómo funciona la PWA](#cómo-funciona-la-pwa)
- [Tests](#tests)
- [CI](#ci)
- [Despliegue](#despliegue)
- [Ampliar la plantilla](#ampliar-la-plantilla)
- [Troubleshooting](#troubleshooting)

## Requisitos

- Node.js 22.12 o superior. El fichero `.nvmrc` fija la versión mayor; con nvm: `nvm use`.
- npm 10 o superior (viene con Node 22).
- Git.
- Para los tests e2e, Chromium de Playwright (se instala con un comando, ver [Tests](#tests)).

## Usar la plantilla en GitHub

1. En la página del repositorio, pulsa **Use this template** → **Create a new repository**. Con la CLI de GitHub:

   ```bash
   gh repo create mi-app --template adri109/BASE-FOR-React-TypeScript-y-Vite-as-PWA --public --clone
   cd mi-app
   ```

   A diferencia de un fork, el repositorio nuevo empieza con un único commit y sin historial de la plantilla.

2. Cambia los datos que identifican la plantilla:

   | Dónde                                      | Qué                                                        |
   | ------------------------------------------ | ---------------------------------------------------------- |
   | `package.json`                             | `name`, `description`                                      |
   | `vite.config.ts` (`manifest`)              | `name`, `short_name`, `description`, `lang`, colores       |
   | `index.html`                               | `<title>`, `description`, `theme-color`, `lang`            |
   | `.env.example` y `.env.local`              | `VITE_APP_NAME`                                            |
   | `public/favicon.svg` y `public/icons/*`    | Iconos (ver [Iconos](#iconos))                             |
   | `LICENSE`                                  | Contiene un texto provisional; sustitúyelo por tu licencia |
   | `.github/ISSUE_TEMPLATE`, `dependabot.yml` | Revisa etiquetas y frecuencia                              |

3. Ajusta los colores de `background_color` y `theme_color` del manifest para que coincidan con el diseño. `theme_color` colorea la barra del sistema; `background_color` se muestra en la pantalla de arranque de la PWA instalada.

## Instalar y ejecutar

```bash
npm install
cp .env.example .env.local
npm run dev
```

La app queda en <http://localhost:5173>. En modo desarrollo el service worker no se registra (ver [PWA en desarrollo](#pwa-en-desarrollo)).

| Script              | Qué hace                                                               |
| ------------------- | ---------------------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con recarga en caliente                         |
| `npm run build`     | Comprueba tipos y genera `dist/` con el manifest y el service worker   |
| `npm run preview`   | Sirve `dist/` en <http://localhost:4173>; es la forma de probar la PWA |
| `npm run lint`      | ESLint sobre todo el repositorio (`lint:fix` aplica las correcciones)  |
| `npm run format`    | Prettier escribe los cambios (`format:check` solo comprueba)           |
| `npm run typecheck` | `tsc --noEmit`                                                         |
| `npm test`          | Tests unitarios con Vitest (`test:watch` en modo interactivo)          |
| `npm run test:e2e`  | Compila, levanta `preview` y ejecuta Playwright                        |
| `npm run icons`     | Regenera los iconos PNG de marcador de posición                        |
| `npm run check`     | Formato, lint, tipos, tests y build; lo mismo que hace la CI (sin e2e) |

## Estructura de carpetas

```text
.
├── .github/
│   ├── workflows/ci.yml          CI y, comentado, despliegue a Cloudflare Pages
│   ├── ISSUE_TEMPLATE/           Plantillas de bug y mejora
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml            Actualizaciones semanales de npm y de Actions
├── e2e/
│   └── app.spec.ts               Tests de Playwright (pantalla, manifest, offline)
├── public/                       Se copia tal cual a dist/
│   ├── favicon.svg
│   ├── icons/                    PNG 192, 512 y maskable 512
│   └── _headers                  Cabeceras de caché y seguridad (Cloudflare, Netlify)
├── scripts/
│   └── generate-icons.mjs        Genera los PNG de marcador de posición sin dependencias
├── src/
│   ├── main.tsx                  Punto de entrada: monta <App /> en #root
│   ├── App.tsx                   Pantalla de ejemplo
│   ├── config.ts                 Lectura tipada de variables de entorno
│   ├── components/
│   │   ├── Counter.tsx           Ejemplo de estado local
│   │   └── PwaPrompt.tsx         Aviso de "versión nueva" y "lista sin conexión"
│   ├── hooks/
│   │   └── useOnlineStatus.ts    Estado de conexión con useSyncExternalStore
│   ├── styles/app.css            Estilos globales, variables y breakpoints
│   ├── test-setup.ts             Configuración de Vitest (jest-dom, limpieza)
│   └── vite-env.d.ts             Tipos de import.meta.env
├── .editorconfig  .prettierrc.json  eslint.config.js
├── .env.example                  Variables de entorno documentadas
├── .nvmrc                        Versión de Node
├── index.html                    HTML de entrada de Vite
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts                Vite, Vitest y configuración de la PWA
```

Los tests unitarios viven junto al código que prueban (`Counter.test.tsx` al lado de `Counter.tsx`). Los e2e están en `e2e/` porque recorren la app entera.

Se usa un único `tsconfig.json` que cubre `src`, `e2e` y los ficheros de configuración. Con una sola app no compensa separar `tsconfig.app.json` y `tsconfig.node.json`.

## Cómo funciona la PWA

Una PWA es una web normal con tres piezas añadidas: un manifest que describe la app, un service worker que intercepta las peticiones y permite funcionar sin red, y HTTPS. `vite-plugin-pwa` genera las dos primeras durante el build a partir de la configuración de `vite.config.ts`.

### 1. Manifest

El bloque `manifest` de `vite.config.ts` se convierte en `dist/manifest.webmanifest`, y el plugin añade a `dist/index.html` la etiqueta `<link rel="manifest" href="/manifest.webmanifest">`. Los campos relevantes:

- `name` y `short_name`: nombre completo y nombre bajo el icono de la pantalla de inicio.
- `display: 'standalone'`: la app se abre sin la barra del navegador.
- `icons`: el navegador exige uno de 192 px y otro de 512 px para considerar la app instalable.
- `purpose: 'maskable'`: el icono `icon-maskable-512.png` deja un margen de seguridad para que Android pueda recortarlo en círculo u otras formas sin cortar el dibujo. Se declara aparte; no se debe marcar el mismo PNG como `any maskable`.
- `start_url` y `scope`: el plugin los rellena a partir de `base` (por defecto `/`), así que no hace falta escribirlos.

Para ver el resultado: `npm run build && cat dist/manifest.webmanifest`.

### 2. Service worker

El plugin usa el modo `generateSW` de Workbox: genera `dist/sw.js` con la lista de ficheros del build y no hay que escribir el service worker a mano. Si necesitas lógica propia (notificaciones push, sincronización en segundo plano), cambia a `strategies: 'injectManifest'` y escribe `src/sw.ts`; la [documentación del plugin](https://vite-pwa-org.netlify.app/guide/inject-manifest) lo explica.

El registro lo hace `useRegisterSW` en `src/components/PwaPrompt.tsx`. Ese hook viene del módulo virtual `virtual:pwa-register/react`, que el plugin crea al compilar; los tipos están en `tsconfig.json` (`vite-plugin-pwa/react`).

Ciclo de vida:

1. **Install**: el navegador descarga `sw.js` y guarda en la caché los ficheros listados (precaché).
2. **Waiting**: si ya había un service worker anterior controlando la página, el nuevo no toma el control mientras haya pestañas abiertas con la versión vieja.
3. **Activate**: con `registerType: 'prompt'`, `PwaPrompt` muestra "Hay una versión nueva disponible". Al pulsar **Recargar**, `updateServiceWorker(true)` envía el mensaje `SKIP_WAITING`, el worker nuevo se activa y la página se recarga con los ficheros nuevos.

La primera vez que se visita la app no hay worker anterior: se instala, rellena la caché y `PwaPrompt` muestra "La app ya funciona sin conexión".

`registerType: 'autoUpdate'` hace lo mismo sin avisar: el worker nuevo se activa y recarga la página solo, lo que puede interrumpir un formulario a medias. `'prompt'` evita eso a cambio de un componente más.

Un navegador solo busca un `sw.js` nuevo cuando se navega y, como mucho, cada 24 horas. Una PWA instalada puede quedarse abierta días, así que `PwaPrompt` llama a `registration.update()` cada hora.

### 3. Estrategia de caché

Lo que hay configurado:

| Qué                                                                 | Estrategia                                   | Efecto                                                                                                                |
| ------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Ficheros del build (`globPatterns`: js, css, html, svg, png, woff2) | Precaché (caché primero)                     | Se sirven desde la caché sin red. Se actualizan solo al publicar un `sw.js` nuevo, comparando el hash de cada fichero |
| Navegaciones (abrir `/` o cualquier ruta de la SPA)                 | `NavigationRoute` → `index.html` precacheado | Las rutas del cliente funcionan offline                                                                               |
| Cachés de versiones anteriores                                      | `cleanupOutdatedCaches`                      | Se borran al activar un worker nuevo                                                                                  |
| Cualquier otra petición (APIs, imágenes externas)                   | Ninguna                                      | Van a la red; sin conexión fallan                                                                                     |

Los ficheros de `dist/assets/` llevan el hash del contenido en el nombre (`index-f16mK1Nf.js`), por lo que una versión nueva nunca sobrescribe a la anterior. Por eso `public/_headers` los marca como `immutable`, mientras que `sw.js`, `manifest.webmanifest` e `index.html` llevan `no-cache`: si el navegador cacheara `sw.js`, no vería las versiones nuevas.

Para cachear datos de una API, añade `runtimeCaching` dentro de `workbox` en `vite.config.ts`:

```ts
workbox: {
  globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
      handler: 'NetworkFirst', // intenta la red; si falla, usa la última respuesta guardada
      options: {
        cacheName: 'api',
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
},
```

Criterio para elegir handler: `NetworkFirst` para datos que deben estar al día, `StaleWhileRevalidate` para datos que toleran estar un poco desfasados, `CacheFirst` para recursos que no cambian. No caches respuestas con datos privados de un usuario sin pensar en qué pasa al cerrar sesión: la caché sigue en el dispositivo.

### 4. Probar offline

El service worker solo existe en el build de producción:

```bash
npm run build
npm run preview
```

1. Abre <http://localhost:4173> en Chrome. Debe aparecer "La app ya funciona sin conexión".
2. DevTools → **Application** → **Service workers**: el estado debe ser `activated and is running`. En **Cache storage** verás la caché de Workbox con los ficheros.
3. Marca **Offline** en esa misma pestaña (o en **Network** → _Offline_) y recarga. La app carga y el indicador pasa a "Sin conexión".
4. Para probar la actualización: con `preview` aún en marcha, cambia un texto en `src/App.tsx`, ejecuta `npm run build` en otra terminal y espera unos segundos o pulsa **Update** en el panel de service workers. Aparece el aviso con el botón **Recargar**.

El test `e2e/app.spec.ts` automatiza los pasos 1 a 3.

### 5. Instalar en el móvil

La instalación requiere HTTPS. `localhost` está exento, pero una IP de la red local (`http://192.168.x.x:4173`) no lo está: ahí el navegador no registra el service worker y no ofrece instalar. Para probar en un dispositivo real, despliega en una URL HTTPS (un preview de Cloudflare Pages, Vercel o Netlify sirve) o abre un túnel (`cloudflared tunnel --url http://localhost:4173`).

- **Android (Chrome)**: menú ⋮ → **Instalar aplicación** (o **Añadir a la pantalla de inicio**). Chrome solo ofrece instalar si el manifest es válido y tiene iconos de 192 y 512 px.
- **iOS (Safari)**: botón **Compartir** → **Añadir a pantalla de inicio**. Safari usa `apple-touch-icon` (declarado en `index.html`) en lugar de los iconos del manifest, y no dispara el evento `beforeinstallprompt`, así que no se puede mostrar un botón propio de "Instalar". Desde iOS 16.4 las PWA instaladas pueden recibir notificaciones push.
- **Escritorio (Chrome, Edge)**: icono de instalación en la barra de direcciones.

Para revisar la instalabilidad: DevTools → **Application** → **Manifest**, que muestra los campos leídos y los problemas detectados.

### PWA en desarrollo

`npm run dev` no registra service worker, a propósito: uno activo durante el desarrollo sirve ficheros viejos de la caché y hace difícil saber qué versión se está viendo. Si necesitas depurar el worker, usa `npm run preview`. El plugin tiene la opción `devOptions.enabled`, pero es mejor evitarla salvo que sea imprescindible.

### Iconos

`public/icons/` contiene PNG de marcador de posición generados por `scripts/generate-icons.mjs` (un disco azul sobre fondo oscuro). Sustitúyelos por los de la marca: 192×192, 512×512 y una versión maskable de 512×512 con el dibujo dentro del 60 % central. Para generarlos a partir de un único SVG o PNG se puede usar `@vite-pwa/assets-generator`. Tras cambiar los iconos, los dispositivos que ya tienen la app instalada pueden tardar en actualizarlos; en Android, a veces hace falta reinstalar.

## Tests

### Unitarios (Vitest + Testing Library)

```bash
npm test           # una ejecución
npm run test:watch # modo interactivo
```

- Entorno `jsdom`, configurado en `vite.config.ts` dentro de `test`.
- `src/test-setup.ts` registra los matchers de `@testing-library/jest-dom` (`toBeInTheDocument`, `toBeDisabled`...) y desmonta los componentes tras cada test.
- Se consulta por rol y nombre accesible (`getByRole('button', { name: 'Sumar' })`), no por clases CSS. Así los tests también sirven como comprobación básica de accesibilidad.
- `useRegisterSW` no puede ejecutarse en jsdom (no hay service worker). `PwaPrompt.test.tsx` lo sustituye con `vi.mock('virtual:pwa-register/react', ...)`; cualquier test que renderice un componente que lo use necesita el mismo mock (`App.test.tsx` lo hace).

### e2e (Playwright)

```bash
npx playwright install --with-deps chromium   # solo la primera vez
npm run test:e2e
```

`playwright.config.ts` ejecuta `npm run build` y `npm run preview` en el puerto 4173 antes de lanzar los tests, para probar el mismo artefacto que se despliega, con service worker. Solo hay un proyecto (Chromium de escritorio). Para añadir móvil:

```ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'mobile', use: { ...devices['Pixel 7'] } },
],
```

Si un test falla, `npx playwright show-report` abre el informe HTML y, tras un reintento, el trace.

## CI

`.github/workflows/ci.yml` se ejecuta en cada push a `main` y en cada pull request:

1. **check**: `npm ci`, `format:check`, `lint`, `typecheck`, `test` y `build`. Sube `dist/` como artefacto durante 7 días.
2. **e2e**: instala Chromium y ejecuta Playwright. Si falla, sube `playwright-report/`.

`actions/setup-node` lee la versión de `.nvmrc` y cachea `~/.npm`. Una ejecución nueva sobre la misma rama cancela la anterior (`concurrency`).

`.github/dependabot.yml` abre cada lunes pull requests agrupadas para las dependencias de npm y las versiones de las Actions. Los mensajes usan `chore(deps)` y `ci(deps)`.

Para exigir que la CI pase antes de fusionar: **Settings** → **Rules** → **Rulesets** (o _Branches_) → exigir los checks `Lint, typecheck, test, build` y `E2E (Playwright)`.

## Despliegue

El build produce ficheros estáticos en `dist/`. Cualquier hosting estático sirve, con tres requisitos: HTTPS, servir `sw.js` y `manifest.webmanifest` sin caché larga y, si usas rutas del cliente, devolver `index.html` para rutas desconocidas.

Ajustes comunes en los tres proveedores:

- Comando de build: `npm run build`. Directorio de salida: `dist`.
- Versión de Node 22 o superior: variable `NODE_VERSION=22` en Cloudflare Pages y Netlify; en Vercel, en los ajustes del proyecto.
- Variables `VITE_*` definidas en el panel del proveedor. Se incorporan al bundle en el build, así que cambiar una exige volver a desplegar.

### Cloudflare Pages

Opción A, integración con Git (la más simple): **Workers & Pages** → **Create** → **Pages** → **Connect to Git**, elige el repositorio y usa los ajustes de arriba. Cada pull request recibe una URL de preview con HTTPS, útil para probar la instalación en el móvil.

Opción B, desde GitHub Actions: crea el proyecto con **Direct Upload**, añade los secretos `CLOUDFLARE_API_TOKEN` (permiso _Cloudflare Pages: Edit_) y `CLOUDFLARE_ACCOUNT_ID`, y la variable `CLOUDFLARE_PAGES_PROJECT`; después descomenta el job `deploy` al final de `ci.yml`.

`public/_headers` se aplica tal cual. Si no hay `404.html`, Pages sirve `index.html` para rutas desconocidas, por lo que las rutas del cliente funcionan.

### Vercel

**Add New → Project**, importa el repositorio. Vercel detecta Vite y propone `npm run build` y `dist`. Vercel ignora `_headers`; crea `vercel.json` con las cabeceras y la reescritura para SPA:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(sw.js|manifest.webmanifest|index.html)",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    }
  ],
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

La reescritura solo es necesaria si añades un router; Vercel sirve antes los ficheros que existen en `dist/`, así que no afecta a `sw.js` ni a los assets.

### Netlify

**Add new site → Import an existing project**. Netlify lee `public/_headers` igual que Cloudflare. Para las rutas del cliente añade `public/_redirects` con:

```text
/*  /index.html  200
```

### Subruta (por ejemplo GitHub Pages)

Si la app no se sirve desde la raíz del dominio, define `VITE_BASE=/nombre-del-repo/` en el build. `vite.config.ts` lo pasa a `base`, y el manifest y el service worker heredan ese alcance. Con un router, pasa también `basename` (ver siguiente sección).

## Ampliar la plantilla

### Añadir rutas

La plantilla no trae router. Con React Router:

```bash
npm install react-router
```

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { App } from './App';
import { About } from './pages/About';

const router = createBrowserRouter(
  [
    { path: '/', element: <App /> },
    { path: '/about', element: <About /> },
  ],
  { basename: import.meta.env.BASE_URL },
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

Crea `src/pages/About.tsx` y enlaza con `<Link to="/about">`. Después de añadir rutas:

- El service worker ya devuelve `index.html` para cualquier navegación, así que entrar directamente a `/about` funciona también sin conexión.
- Si el backend comparte dominio y sirve rutas como `/api/...`, exclúyelas del fallback con `workbox.navigateFallbackDenylist: [/^\/api\//]`.
- El hosting debe devolver `index.html` para rutas desconocidas (ver [Despliegue](#despliegue)).
- Para no cargar todas las páginas en el primer bundle, usa `React.lazy` o la propiedad `lazy` de las rutas. Los chunks generados también entran en el precaché porque `globPatterns` incluye `js`.

### Estado

- Estado local de un componente: `useState` o `useReducer`, como en `Counter.tsx`.
- Estado compartido por pocos componentes: elévalo al ancestro común o usa Context.
- Estado global con muchos consumidores: una librería pequeña como Zustand (`npm install zustand`) evita re-renderizados de más que provoca un Context grande.
- Datos del servidor: TanStack Query gestiona caché, reintentos y estados de carga. Combínalo con `runtimeCaching` si debe funcionar offline.
- Persistencia en el dispositivo: `localStorage` para valores pequeños y síncronos; IndexedDB (por ejemplo con `idb`) para volúmenes mayores o datos que deban sobrevivir sin conexión.

### Estilos

Los estilos globales están en `src/styles/app.css`, importado desde `main.tsx`.

- Los colores, el espaciado base (`--gap`) y la tipografía son variables CSS en `:root`.
- Se diseña primero para móvil y se amplía con `min-width`: tablet desde 640 px y escritorio desde 1024 px. Los botones ocupan todo el ancho en móvil y pasan a fila en tablet.
- `.page` y `.toast` usan `env(safe-area-inset-*)` para no quedar bajo el notch o la barra de gestos en una PWA instalada (requiere `viewport-fit=cover` en `index.html`, que ya está).
- Los botones tienen un alto mínimo de 44 px, tamaño recomendado para pulsar con el dedo.

Alternativas sin configuración extra: CSS Modules (ficheros `*.module.css`, que Vite soporta de serie). Tailwind CSS se integra con `@tailwindcss/vite`; sigue su guía de instalación para Vite.

### Variables de entorno

Vite carga `.env`, `.env.local`, `.env.[mode]` y `.env.[mode].local`; los `.local` y cualquier `.env*` salvo `.env.example` están en `.gitignore`.

Para añadir una variable:

1. Nómbrala con prefijo `VITE_` en `.env.local` (sin prefijo Vite no la expone al cliente) y documéntala en `.env.example`.
2. Declárala en `src/vite-env.d.ts`, dentro de `ImportMetaEnv`, para que TypeScript la conozca.
3. Léela en un único sitio, `src/config.ts`, y usa ese módulo desde el resto de la app.
4. Define el mismo valor en el panel del hosting y en el job de CI que haga el build, si no es la de por defecto.

Todo lo que lleve prefijo `VITE_` queda en el JavaScript publicado y es visible para cualquier usuario. No pongas ahí claves privadas, tokens ni contraseñas; esos valores van en un backend.

`VITE_BASE` es la excepción: se lee en `vite.config.ts` (Node), no en el cliente.

## Troubleshooting

**Veo una versión vieja de la app tras desplegar.**
El service worker anterior sigue sirviendo su caché hasta que se activa el nuevo. Debería aparecer el aviso **Recargar**. Si no aparece, comprueba que `sw.js` se sirve con `Cache-Control: no-cache` (`curl -I https://tu-dominio/sw.js`). Para limpiar a mano: DevTools → **Application** → **Service workers** → **Unregister**, y **Storage** → **Clear site data**.

**Mientras desarrollo, la app muestra cambios antiguos.**
Probablemente se registró un service worker en `localhost:5173` desde un build anterior o desde otro proyecto en el mismo puerto. Desregístralo como arriba. Evita usar el mismo puerto para proyectos distintos con PWA.

**El navegador no ofrece instalar la app.**
Comprueba en **Application** → **Manifest** qué falla. Causas habituales: la página no está en HTTPS, faltan los iconos de 192 o 512 px, `sw.js` no se registra o la app ya está instalada.

**En iOS no aparece "Instalar".**
Safari no tiene aviso de instalación. Se hace a mano desde **Compartir** → **Añadir a pantalla de inicio**. En iOS, la PWA instalada y Safari tienen almacenamiento separado.

**`Cannot find module 'virtual:pwa-register/react'`.**
Falta el tipo en `tsconfig.json` (`"types": [..., "vite-plugin-pwa/react"]`) o el plugin no está en `vite.config.ts`. En Vitest, el módulo se resuelve gracias al plugin; si falla en un test concreto, mockéalo como en `PwaPrompt.test.tsx`.

**Playwright: `Executable doesn't exist`.**
Falta el navegador: `npx playwright install --with-deps chromium`. En Linux, `--with-deps` instala también las librerías del sistema y puede requerir `sudo`.

**Playwright: el puerto 4173 está ocupado.**
Otro `npm run preview` sigue en marcha. Ciérralo o cambia `port` en `playwright.config.ts`. En local, `reuseExistingServer` reutiliza ese servidor, que puede ser de una build anterior.

**`npm install` avisa de `engines` o falla el build en CI.**
Comprueba `node -v` frente a `.nvmrc`. Con nvm: `nvm install && nvm use`.

**`npm audit` muestra avisos de `glob`/`minimatch`.**
Vienen de `workbox-build`, dependencia transitiva de `vite-plugin-pwa` que solo se ejecuta en el build, no en el navegador del usuario. Dependabot propondrá la actualización cuando Workbox publique una versión corregida; `npm audit fix --force` haría un downgrade del plugin y no se recomienda.

**La app instalada no refleja los iconos o el nombre nuevos.**
El sistema operativo guarda una copia del manifest en el momento de instalar. Desinstala y vuelve a instalar la app.

## Licencia

`LICENSE` contiene un texto provisional. Sustitúyelo por la licencia que elijas antes de publicar un proyecto derivado.

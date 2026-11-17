# ADR 0001: stack base

- Estado: aceptada
- Contexto: un único desarrollador, coste fijo mínimo, datos de alumnos en la UE, cliente offline-first.
- Decisión: monorepo pnpm; cliente React + Vite (PWA); mapa en PixiJS con equivalente DOM/ARIA;
  backend en Supabase (Postgres + Auth + RLS); contenido como YAML en Git validado con zod;
  hosting estático en Cloudflare Pages.
- Consecuencias: sin servidores propios que operar; el aislamiento multi-tenant depende de RLS y
  de sus tests; el esquema es SQL estándar, por lo que migrar de proveedor no obliga a reescribir el modelo.

Copiar este fichero como `NNNN-titulo.md` para cada decisión técnica relevante.

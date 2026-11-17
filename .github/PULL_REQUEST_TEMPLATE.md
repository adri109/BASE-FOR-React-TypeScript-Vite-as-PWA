## Qué cambia

<!-- Una o dos frases. Enlaza el issue: Closes #N -->

## Cómo se ha probado

- [ ] `pnpm check` en local
- [ ] Migración nueva: `pnpm db:reset && pnpm db:test`
- [ ] Contenido nuevo: `pnpm content:validate`

## Checklist

- [ ] UI: verificado en móvil (< 640 px), tablet (640–1024 px) y escritorio (> 1024 px)
- [ ] Sin secretos ni claves `service_role` en el cliente
- [ ] Tablas nuevas con `academy_id`, RLS activada y test de aislamiento
- [ ] Docs/README actualizados si cambia un script, variable de entorno o flujo

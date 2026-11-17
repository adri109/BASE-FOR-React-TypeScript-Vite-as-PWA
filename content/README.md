# content/

Contenido didáctico versionado como datos. Un tema = una carpeta:

```
themes/<theme-id>/
  theme.yaml       # metadatos, explicación, errores típicos, prerrequisitos
  exercises.yaml   # lista de ejercicios del tema
schema/            # JSON Schema generado (no editar a mano): pnpm content:schema
```

Reglas (validadas por `pnpm content:validate`, también en CI):

- El `id` del tema coincide con el nombre de la carpeta; `exercises.theme` también.
- `prerequisites` apunta a temas existentes y no forma ciclos.
- Cada tema tiene ejercicios; los `id` de ejercicio son únicos dentro del tema.
- Tipos de ejercicio: `multiple_choice`, `fill_blank` (marcador `___`), `reorder`.
- Claves desconocidas se rechazan (esquema estricto).

Los ficheros YAML llevan la cabecera `# yaml-language-server: $schema=...` para
autocompletado en VS Code (extensión Red Hat YAML).

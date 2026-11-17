import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import type { ZodType } from 'zod';
import {
  exerciseFileSchema,
  themeSchema,
  validateBundle,
  type ContentBundle,
  type ContentIssue,
} from '@app/shared';

export interface LoadResult {
  bundle: ContentBundle;
  issues: ContentIssue[];
}

async function readYaml<T>(file: string, schema: ZodType<T>, issues: ContentIssue[]) {
  let raw: unknown;
  try {
    raw = parse(await readFile(file, 'utf8'));
  } catch (err) {
    issues.push({ where: file, message: `YAML inválido o ilegible: ${(err as Error).message}` });
    return undefined;
  }
  const res = schema.safeParse(raw);
  if (!res.success) {
    for (const i of res.error.issues) {
      issues.push({ where: file, message: `${i.path.join('.') || '(raíz)'}: ${i.message}` });
    }
    return undefined;
  }
  return res.data;
}

/** Estructura esperada: `<dir>/themes/<theme-id>/{theme.yaml,exercises.yaml}`. */
export async function loadContent(contentDir: string): Promise<LoadResult> {
  const issues: ContentIssue[] = [];
  const bundle: ContentBundle = { themes: [], exerciseFiles: [] };
  const themesDir = path.join(contentDir, 'themes');

  const entries = await readdir(themesDir, { withFileTypes: true });
  for (const entry of entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const dir = path.join(themesDir, entry.name);
    const theme = await readYaml(path.join(dir, 'theme.yaml'), themeSchema, issues);
    const exercises = await readYaml(path.join(dir, 'exercises.yaml'), exerciseFileSchema, issues);

    if (theme) {
      bundle.themes.push(theme);
      if (theme.id !== entry.name) {
        issues.push({
          where: dir,
          message: `el id "${theme.id}" no coincide con el nombre de carpeta`,
        });
      }
    }
    if (exercises) {
      bundle.exerciseFiles.push(exercises);
      if (exercises.theme !== entry.name) {
        issues.push({
          where: dir,
          message: `exercises.theme "${exercises.theme}" no coincide con la carpeta`,
        });
      }
    }
  }

  if (issues.length === 0) issues.push(...validateBundle(bundle));
  return { bundle, issues };
}

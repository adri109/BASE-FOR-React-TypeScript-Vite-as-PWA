import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { exerciseFileSchema, themeSchema } from '@app/shared';

const targets = {
  'theme.schema.json': themeSchema,
  'exercises.schema.json': exerciseFileSchema,
} as const;

/** Escribe (o comprueba con `check`) los JSON Schema usados por el editor y por CI. */
export async function syncSchemas(outDir: string, check: boolean): Promise<string[]> {
  const stale: string[] = [];
  await mkdir(outDir, { recursive: true });
  for (const [name, schema] of Object.entries(targets)) {
    const json = `${JSON.stringify(z.toJSONSchema(schema), null, 2)}\n`;
    const file = path.join(outDir, name);
    if (check) {
      const current = await readFile(file, 'utf8').catch(() => '');
      if (current !== json) stale.push(name);
    } else {
      await writeFile(file, json);
    }
  }
  return stale;
}

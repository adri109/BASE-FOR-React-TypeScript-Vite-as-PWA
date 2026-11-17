import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ContentBundle, MapNode } from '@app/shared';

/** Genera los paquetes JSON que consume el cliente (`apps/web/public/content`). */
export async function buildPacks(bundle: ContentBundle, outDir: string): Promise<string[]> {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(path.join(outDir, 'themes'), { recursive: true });

  const nodes: MapNode[] = bundle.themes.map((t) => ({
    id: t.id,
    title: t.title,
    level: t.level,
    branch: t.branch,
    prerequisites: t.prerequisites,
    status: t.prerequisites.length === 0 ? 'active' : 'locked',
  }));

  const written: string[] = [];
  const write = async (rel: string, data: unknown) => {
    await writeFile(path.join(outDir, rel), `${JSON.stringify(data)}\n`);
    written.push(rel);
  };

  await write('map.json', { nodes });
  for (const theme of bundle.themes) {
    const file = bundle.exerciseFiles.find((f) => f.theme === theme.id);
    await write(`themes/${theme.id}.json`, { theme, exercises: file?.exercises ?? [] });
  }
  return written;
}

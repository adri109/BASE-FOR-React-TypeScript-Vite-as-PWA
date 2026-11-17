import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildPacks } from './build';
import { loadContent } from './load';

const contentDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../content');

describe('content del repositorio', () => {
  it('valida sin incidencias', async () => {
    const { issues } = await loadContent(contentDir);
    expect(issues).toEqual([]);
  });

  it('genera map.json y un paquete por tema', async () => {
    const { bundle } = await loadContent(contentDir);
    const out = await mkdtemp(path.join(os.tmpdir(), 'packs-'));
    await buildPacks(bundle, out);

    const map = JSON.parse(await readFile(path.join(out, 'map.json'), 'utf8')) as {
      nodes: { id: string }[];
    };
    const themeFiles = await readdir(path.join(out, 'themes'));
    expect(map.nodes).toHaveLength(bundle.themes.length);
    expect(themeFiles).toHaveLength(bundle.themes.length);
  });
});

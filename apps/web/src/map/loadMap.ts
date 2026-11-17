import { createDemoMap, mapPackSchema, type MapNode } from '@app/shared';

export interface LoadedMap {
  nodes: MapNode[];
  source: 'content' | 'demo';
}

const MAX_DEMO_NODES = 2000;

/**
 * Prioridad: `?nodes=N` (spike de rendimiento) > paquete generado por `pnpm content:build`
 * > mapa ficticio.
 */
export async function loadMap(search = window.location.search): Promise<LoadedMap> {
  const requested = Number(new URLSearchParams(search).get('nodes'));
  if (Number.isInteger(requested) && requested > 0) {
    return { nodes: createDemoMap(Math.min(requested, MAX_DEMO_NODES)), source: 'demo' };
  }

  try {
    const res = await fetch(`${import.meta.env.BASE_URL}content/map.json`);
    if (res.ok && (res.headers.get('content-type') ?? '').includes('json')) {
      const pack = mapPackSchema.parse(await res.json());
      if (pack.nodes.length > 0) return { nodes: pack.nodes, source: 'content' };
    }
  } catch {
    // Sin paquete (primer arranque, offline sin caché o JSON inválido): se usa el demo.
  }
  return { nodes: createDemoMap(), source: 'demo' };
}

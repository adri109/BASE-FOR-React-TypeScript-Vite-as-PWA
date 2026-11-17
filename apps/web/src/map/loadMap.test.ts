import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadMap } from './loadMap';

afterEach(() => vi.unstubAllGlobals());

describe('loadMap', () => {
  it('genera N nodos con ?nodes=N sin pedir red', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const map = await loadMap('?nodes=600');
    expect(map.nodes).toHaveLength(600);
    expect(map.source).toBe('demo');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('usa el paquete de contenido si es válido', async () => {
    const pack = {
      nodes: [
        {
          id: 'x',
          title: 'X',
          level: 'B2',
          branch: 'grammar',
          prerequisites: [],
          status: 'active',
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(pack), { headers: { 'content-type': 'application/json' } }),
        ),
    );
    const map = await loadMap('');
    expect(map.source).toBe('content');
    expect(map.nodes).toHaveLength(1);
  });

  it('cae al demo si la respuesta no es JSON (fallback SPA)', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('<html>', { headers: { 'content-type': 'text/html' } })),
    );
    const map = await loadMap('');
    expect(map.source).toBe('demo');
  });
});

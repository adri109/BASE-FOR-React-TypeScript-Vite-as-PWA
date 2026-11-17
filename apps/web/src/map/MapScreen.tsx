import { useEffect, useMemo, useRef, useState } from 'react';
import { layoutPolar, type Branch } from '@app/shared';
import { loadMap, type LoadedMap } from './loadMap';
import { BranchFilter, NodeDetail, NodeList } from './NodeList';
import type { MapRenderer } from './renderer';

type RendererState = 'loading' | 'ready' | 'unsupported';
type Pane = 'map' | 'list';

export function MapScreen() {
  const [map, setMap] = useState<LoadedMap | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [branch, setBranch] = useState<Branch | 'all'>('all');
  const [pane, setPane] = useState<Pane>('map');
  const [rendererState, setRendererState] = useState<RendererState>('loading');
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<MapRenderer | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMap().then((loaded) => !cancelled && setMap(loaded));
    return () => {
      cancelled = true;
    };
  }, []);

  const layout = useMemo(() => (map ? layoutPolar(map.nodes) : null), [map]);
  const nodesById = useMemo(() => new Map(map?.nodes.map((n) => [n.id, n])), [map]);
  const visibleNodes = useMemo(
    () => map?.nodes.filter((n) => branch === 'all' || n.branch === branch) ?? [],
    [map, branch],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const created = import('./renderer').then(({ MapRenderer: Renderer }) =>
      Renderer.create(host, { onSelect: setSelectedId }),
    );
    created
      .then((renderer) => {
        if (disposed) {
          renderer.destroy();
          return;
        }
        rendererRef.current = renderer;
        setRendererState('ready');
      })
      .catch(() => {
        if (!disposed) setRendererState('unsupported');
      });
    return () => {
      disposed = true;
      rendererRef.current = null;
      void created.then((renderer) => renderer.destroy()).catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (rendererState === 'ready' && layout) rendererRef.current?.setLayout(layout);
  }, [rendererState, layout]);

  useEffect(() => {
    rendererRef.current?.setSelected(selectedId);
  }, [rendererState, selectedId]);

  return (
    <main className="map-screen" data-pane={pane}>
      <div className="pane-toggle" role="group" aria-label="Vista">
        <button type="button" aria-pressed={pane === 'map'} onClick={() => setPane('map')}>
          Mapa
        </button>
        <button type="button" aria-pressed={pane === 'list'} onClick={() => setPane('list')}>
          Lista
        </button>
      </div>

      <section className="map-stage" aria-label="Mapa de anillos">
        <div ref={hostRef} className="map-canvas" aria-hidden="true" data-testid="map-canvas" />
        {rendererState === 'unsupported' && (
          <p className="notice" role="status">
            WebGL no disponible: usa la lista de nodos.
          </p>
        )}
        <button
          type="button"
          className="reset-view"
          onClick={() => rendererRef.current?.resetView()}
          hidden={rendererState !== 'ready'}
        >
          Centrar
        </button>
      </section>

      <aside className="map-panel" aria-label="Nodos">
        <p className="source" data-testid="map-source">
          {map ? `Fuente: ${map.source} · ${map.nodes.length} nodos` : 'Cargando…'}
        </p>
        <BranchFilter value={branch} onChange={setBranch} />
        <NodeDetail
          node={selectedId ? nodesById.get(selectedId) : undefined}
          nodesById={nodesById}
        />
        <NodeList nodes={visibleNodes} selectedId={selectedId} onSelect={setSelectedId} />
      </aside>
    </main>
  );
}

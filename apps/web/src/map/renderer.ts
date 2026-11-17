import { Application, Container, Graphics } from 'pixi.js';
import { LEVELS, type MapLayout, type PositionedNode } from '@app/shared';
import { BACKGROUND, LEVEL_TINT, SELECTION_COLOR, STATUS_COLOR } from './palette';

export interface MapRendererOptions {
  onSelect: (id: string | null) => void;
}

const NODE_RADIUS = 7;
/** Tolerancia táctil en píxeles de pantalla (objetivo ~44 px). */
const HIT_RADIUS_PX = 22;
const DRAG_THRESHOLD_PX = 6;
const MIN_SCALE = 0.2;
const MAX_SCALE = 6;

/**
 * Renderizador PixiJS. Dibuja bajo demanda (sin ticker continuo) para no gastar batería:
 * solo se repinta tras pan, zoom, resize o cambio de datos.
 */
export class MapRenderer {
  static async create(host: HTMLElement, options: MapRendererOptions): Promise<MapRenderer> {
    const app = new Application();
    await app.init({
      resizeTo: host,
      background: BACKGROUND,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoStart: false,
    });
    host.appendChild(app.canvas);
    return new MapRenderer(app, options);
  }

  private readonly world = new Container();
  private readonly rings = new Graphics();
  private readonly edges = new Graphics();
  private readonly dots = new Graphics();
  private readonly selection = new Graphics();
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private layout: MapLayout | null = null;
  private selectedId: string | null = null;
  private userMoved = false;
  private frame = 0;
  private dragDistance = 0;
  private pinchStart: { dist: number; scale: number } | null = null;
  private readonly resizeObserver: ResizeObserver;

  private constructor(
    private readonly app: Application,
    private readonly options: MapRendererOptions,
  ) {
    this.world.addChild(this.rings, this.edges, this.dots, this.selection);
    app.stage.addChild(this.world);

    const canvas = app.canvas;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.userMoved) this.fit();
      this.requestRender();
    });
    this.resizeObserver.observe(app.canvas.parentElement ?? app.canvas);
  }

  setLayout(layout: MapLayout): void {
    this.layout = layout;
    this.drawStatic();
    this.drawSelection();
    this.userMoved = false;
    this.fit();
    this.requestRender();
  }

  setSelected(id: string | null): void {
    this.selectedId = id;
    this.drawSelection();
    this.requestRender();
  }

  resetView(): void {
    this.userMoved = false;
    this.fit();
    this.requestRender();
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    const canvas = this.app.canvas;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointercancel', this.onPointerUp);
    canvas.removeEventListener('wheel', this.onWheel);
    this.app.destroy(true, { children: true });
  }

  private requestRender(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.app.render();
    });
  }

  private fit(): void {
    if (!this.layout) return;
    const { width, height } = this.app.screen;
    const extent = (this.layout.radius + 40) * 2;
    const scale = Math.max(MIN_SCALE, Math.min(width, height) / extent);
    this.world.scale.set(scale);
    this.world.position.set(width / 2, height / 2);
  }

  private drawStatic(): void {
    const layout = this.layout;
    if (!layout) return;

    this.rings.clear();
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      const level = LEVELS[i]!;
      this.rings
        .circle(0, 0, layout.ringRadii[i] ?? 0)
        .fill({ color: LEVEL_TINT[level] })
        .stroke({ width: 1, color: 0xffffff, alpha: 0.12 });
    }

    const byId = new Map(layout.nodes.map((n) => [n.id, n]));
    this.edges.clear();
    for (const node of layout.nodes) {
      for (const pre of node.prerequisites) {
        const from = byId.get(pre);
        if (from) this.edges.moveTo(from.x, from.y).lineTo(node.x, node.y);
      }
    }
    this.edges.stroke({ width: 1, color: 0xffffff, alpha: 0.25 });

    this.dots.clear();
    for (const node of layout.nodes) {
      this.dots.circle(node.x, node.y, NODE_RADIUS).fill({ color: STATUS_COLOR[node.status] });
    }
  }

  private drawSelection(): void {
    this.selection.clear();
    const node = this.layout?.nodes.find((n) => n.id === this.selectedId);
    if (!node) return;
    this.selection
      .circle(node.x, node.y, NODE_RADIUS + 5)
      .stroke({ width: 3, color: SELECTION_COLOR });
  }

  private screenToWorld(x: number, y: number) {
    const s = this.world.scale.x;
    return { x: (x - this.world.x) / s, y: (y - this.world.y) / s };
  }

  private pick(clientX: number, clientY: number): PositionedNode | null {
    if (!this.layout) return null;
    const rect = this.app.canvas.getBoundingClientRect();
    const p = this.screenToWorld(clientX - rect.left, clientY - rect.top);
    const limit = HIT_RADIUS_PX / this.world.scale.x;
    let best: PositionedNode | null = null;
    let bestDist = limit;
    for (const n of this.layout.nodes) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < bestDist) {
        best = n;
        bestDist = d;
      }
    }
    return best;
  }

  private zoomAt(factor: number, sx: number, sy: number): void {
    const before = this.screenToWorld(sx, sy);
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.world.scale.x * factor));
    this.world.scale.set(scale);
    this.world.position.set(sx - before.x * scale, sy - before.y * scale);
    this.userMoved = true;
    this.requestRender();
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.app.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.dragDistance = 0;
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()] as [
        { x: number; y: number },
        { x: number; y: number },
      ];
      this.pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: this.world.scale.x };
    }
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    const prev = this.pointers.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };

    if (this.pointers.size === 2 && this.pinchStart) {
      this.pointers.set(e.pointerId, next);
      const [a, b] = [...this.pointers.values()] as [
        { x: number; y: number },
        { x: number; y: number },
      ];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = this.app.canvas.getBoundingClientRect();
      const target = (this.pinchStart.scale * dist) / this.pinchStart.dist;
      this.zoomAt(
        target / this.world.scale.x,
        (a.x + b.x) / 2 - rect.left,
        (a.y + b.y) / 2 - rect.top,
      );
      this.dragDistance = Infinity;
      return;
    }

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    this.dragDistance += Math.abs(dx) + Math.abs(dy);
    this.pointers.set(e.pointerId, next);
    if (this.dragDistance > DRAG_THRESHOLD_PX) {
      this.world.position.x += dx;
      this.world.position.y += dy;
      this.userMoved = true;
      this.requestRender();
    }
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    const wasTap = this.pointers.size === 1 && this.dragDistance <= DRAG_THRESHOLD_PX;
    this.pointers.delete(e.pointerId);
    this.pinchStart = null;
    if (e.type === 'pointerup' && wasTap) {
      this.options.onSelect(this.pick(e.clientX, e.clientY)?.id ?? null);
    }
  };

  private readonly onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const rect = this.app.canvas.getBoundingClientRect();
    this.zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
  };
}

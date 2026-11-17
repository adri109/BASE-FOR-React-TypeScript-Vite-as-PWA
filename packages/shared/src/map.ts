import { BRANCHES, LEVELS, type Branch, type Level } from './taxonomy';

export type NodeStatus = 'locked' | 'active' | 'mastered';

export interface MapNode {
  id: string;
  title: string;
  level: Level;
  branch: Branch;
  prerequisites: string[];
  status: NodeStatus;
}

export interface PositionedNode extends MapNode {
  x: number;
  y: number;
  /** Ángulo en radianes; 0 apunta a la derecha y crece en sentido horario (eje y hacia abajo). */
  angle: number;
  ring: number;
}

export interface MapLayout {
  nodes: PositionedNode[];
  /** Radio exterior de cada anillo, indexado por LEVELS. */
  ringRadii: number[];
  radius: number;
}

export interface LayoutOptions {
  innerRadius?: number;
  ringGap?: number;
  /** Margen angular (rad) entre sectores de ramas. */
  sectorPadding?: number;
}

/**
 * Layout polar determinista: anillo = nivel, sector = rama. Independiente del renderizador
 * (el cliente lo pinta con PixiJS, pero puede probarse sin gráficos).
 */
export function layoutPolar(nodes: MapNode[], options: LayoutOptions = {}): MapLayout {
  const innerRadius = options.innerRadius ?? 90;
  const ringGap = options.ringGap ?? 110;
  const padding = options.sectorPadding ?? 0.12;
  const sector = (Math.PI * 2) / BRANCHES.length;

  const groups = new Map<string, MapNode[]>();
  for (const node of nodes) {
    const key = `${node.level}/${node.branch}`;
    const list = groups.get(key);
    if (list) list.push(node);
    else groups.set(key, [node]);
  }

  const positioned: PositionedNode[] = [];
  for (const [key, group] of groups) {
    const [level, branch] = key.split('/') as [Level, Branch];
    const ring = LEVELS.indexOf(level);
    const radius = innerRadius + ring * ringGap;
    const start = BRANCHES.indexOf(branch) * sector - Math.PI / 2 + padding;
    const span = sector - padding * 2;
    group.forEach((node, i) => {
      const angle = start + (span * (i + 0.5)) / group.length;
      positioned.push({
        ...node,
        ring,
        angle,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    });
  }

  const ringRadii = LEVELS.map((_, i) => innerRadius + i * ringGap + ringGap / 2);
  return { nodes: positioned, ringRadii, radius: ringRadii[ringRadii.length - 1] ?? innerRadius };
}

/** Mapa ficticio con `count` nodos repartidos por nivel y rama (spike de rendimiento). */
export function createDemoMap(count = 48): MapNode[] {
  const nodes: MapNode[] = [];
  const perLevel = Math.max(1, Math.ceil(count / LEVELS.length));
  for (let i = 0; i < count; i++) {
    const level = LEVELS[Math.min(LEVELS.length - 1, Math.floor(i / perLevel))] as Level;
    const branch = BRANCHES[i % BRANCHES.length] as Branch;
    const prev = i >= BRANCHES.length ? [`demo-${i - BRANCHES.length + 1}`] : [];
    nodes.push({
      id: `demo-${i + 1}`,
      title: `Nodo ${i + 1}`,
      level,
      branch,
      prerequisites: prev,
      status: i < 4 ? 'mastered' : i < 10 ? 'active' : 'locked',
    });
  }
  return nodes;
}

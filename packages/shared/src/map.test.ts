import { describe, expect, it } from 'vitest';
import { createDemoMap, layoutPolar } from './map';
import { LEVELS } from './taxonomy';

describe('layoutPolar', () => {
  it('posiciona todos los nodos sin perder ninguno', () => {
    const layout = layoutPolar(createDemoMap(600));
    expect(layout.nodes).toHaveLength(600);
  });

  it('coloca cada nodo sobre el radio de su anillo', () => {
    const layout = layoutPolar(createDemoMap(48), { innerRadius: 100, ringGap: 100 });
    for (const n of layout.nodes) {
      expect(Math.hypot(n.x, n.y)).toBeCloseTo(100 + n.ring * 100, 6);
    }
  });

  it('es determinista', () => {
    const a = layoutPolar(createDemoMap(48));
    const b = layoutPolar(createDemoMap(48));
    expect(a).toEqual(b);
  });

  it('devuelve un radio exterior por nivel', () => {
    expect(layoutPolar(createDemoMap(10)).ringRadii).toHaveLength(LEVELS.length);
  });
});

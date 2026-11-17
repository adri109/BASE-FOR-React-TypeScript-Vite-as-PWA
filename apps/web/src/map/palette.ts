import type { Level } from '@app/shared';

/** Tinte del fondo de cada anillo (hex numérico para Pixi). Mantener contraste >= 4.5:1 del texto en CSS. */
export const LEVEL_TINT: Record<Level, number> = {
  A1: 0x1c3a2e,
  A2: 0x1f4a3c,
  B1: 0x1d3f5c,
  B2: 0x2a3a6e,
  C1: 0x44336e,
  C2: 0x5a2f5c,
};

export const STATUS_COLOR = {
  locked: 0x6b7385,
  active: 0xffd166,
  mastered: 0x52d19c,
} as const;

export const BACKGROUND = 0x0f1420;
export const SELECTION_COLOR = 0xffffff;

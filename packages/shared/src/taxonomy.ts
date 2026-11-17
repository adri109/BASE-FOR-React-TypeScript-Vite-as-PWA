export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type Level = (typeof LEVELS)[number];

export const BRANCHES = ['grammar', 'vocabulary', 'listening', 'pronunciation'] as const;
export type Branch = (typeof BRANCHES)[number];

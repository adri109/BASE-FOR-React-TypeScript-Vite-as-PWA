import type { Branch, NodeStatus } from '@app/shared';

export const BRANCH_LABEL: Record<Branch, string> = {
  grammar: 'Gramática',
  vocabulary: 'Vocabulario',
  listening: 'Listening',
  pronunciation: 'Pronunciación',
};

export const STATUS_LABEL: Record<NodeStatus, string> = {
  locked: 'Bloqueado',
  active: 'Activo',
  mastered: 'Dominado',
};

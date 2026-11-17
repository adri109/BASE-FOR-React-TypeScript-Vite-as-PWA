import type { Branch, MapNode } from '@app/shared';
import { BRANCHES } from '@app/shared';
import { BRANCH_LABEL, STATUS_LABEL } from './labels';

interface BranchFilterProps {
  value: Branch | 'all';
  onChange: (value: Branch | 'all') => void;
}

export function BranchFilter({ value, onChange }: BranchFilterProps) {
  const options: (Branch | 'all')[] = ['all', ...BRANCHES];
  return (
    <div className="chips" role="group" aria-label="Filtrar por rama">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="chip"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option === 'all' ? 'Todas' : BRANCH_LABEL[option]}
        </button>
      ))}
    </div>
  );
}

interface NodeListProps {
  nodes: MapNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Equivalente accesible del mapa: misma información, navegable por teclado y lector de pantalla. */
export function NodeList({ nodes, selectedId, onSelect }: NodeListProps) {
  if (nodes.length === 0) return <p className="empty">No hay nodos para este filtro.</p>;
  return (
    <ul className="node-list" aria-label="Nodos del mapa">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            className="node-item"
            data-status={node.status}
            aria-current={node.id === selectedId ? 'true' : undefined}
            onClick={() => onSelect(node.id)}
          >
            <span className="node-title">{node.title}</span>
            <span className="node-meta">
              {node.level} · {BRANCH_LABEL[node.branch]} · {STATUS_LABEL[node.status]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

interface NodeDetailProps {
  node: MapNode | undefined;
  nodesById: Map<string, MapNode>;
}

export function NodeDetail({ node, nodesById }: NodeDetailProps) {
  if (!node) return <p className="empty">Selecciona un nodo en el mapa o en la lista.</p>;
  return (
    <section className="detail" aria-live="polite" aria-label="Detalle del nodo">
      <h2 className="detail-title">{node.title}</h2>
      <p className="node-meta">
        {node.level} · {BRANCH_LABEL[node.branch]} · {STATUS_LABEL[node.status]}
      </p>
      <p className="detail-pre">
        Prerrequisitos:{' '}
        {node.prerequisites.length === 0
          ? 'ninguno'
          : node.prerequisites.map((id) => nodesById.get(id)?.title ?? id).join(', ')}
      </p>
    </section>
  );
}

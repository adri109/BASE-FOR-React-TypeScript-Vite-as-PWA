import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MapNode } from '@app/shared';
import { BranchFilter, NodeDetail, NodeList } from './NodeList';

const nodes: MapNode[] = [
  { id: 'a', title: 'Alpha', level: 'B1', branch: 'grammar', prerequisites: [], status: 'active' },
  {
    id: 'b',
    title: 'Beta',
    level: 'B2',
    branch: 'vocabulary',
    prerequisites: ['a'],
    status: 'locked',
  },
];

describe('NodeList', () => {
  it('renderiza un botón por nodo con nivel, rama y estado en texto', () => {
    render(<NodeList nodes={nodes} selectedId={null} onSelect={() => undefined} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByText('B2 · Vocabulario · Bloqueado')).toBeTruthy();
  });

  it('marca el nodo seleccionado con aria-current y notifica la selección', () => {
    const onSelect = vi.fn();
    render(<NodeList nodes={nodes} selectedId="a" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /Alpha/ }).getAttribute('aria-current')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /Beta/ }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('muestra un mensaje cuando no hay nodos', () => {
    render(<NodeList nodes={[]} selectedId={null} onSelect={() => undefined} />);
    expect(screen.getByText(/No hay nodos/)).toBeTruthy();
  });
});

describe('BranchFilter', () => {
  it('expone el estado con aria-pressed y emite el cambio', () => {
    const onChange = vi.fn();
    render(<BranchFilter value="all" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Todas' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Listening' }));
    expect(onChange).toHaveBeenCalledWith('listening');
  });
});

describe('NodeDetail', () => {
  it('resuelve los prerrequisitos por título', () => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    render(<NodeDetail node={nodes[1]} nodesById={byId} />);
    expect(screen.getByText(/Prerrequisitos: Alpha/)).toBeTruthy();
  });
});

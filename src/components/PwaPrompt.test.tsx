import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PwaPrompt } from './PwaPrompt';

const sw = vi.hoisted(() => ({
  offlineReady: false,
  needRefresh: false,
  setOfflineReady: vi.fn(),
  setNeedRefresh: vi.fn(),
  updateServiceWorker: vi.fn(),
}));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [sw.offlineReady, sw.setOfflineReady],
    needRefresh: [sw.needRefresh, sw.setNeedRefresh],
    updateServiceWorker: sw.updateServiceWorker,
  }),
}));

describe('PwaPrompt', () => {
  beforeEach(() => {
    sw.offlineReady = false;
    sw.needRefresh = false;
    vi.clearAllMocks();
  });

  it('no renderiza nada sin eventos del service worker', () => {
    const { container } = render(<PwaPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('avisa de que la app ya funciona sin conexión', async () => {
    sw.offlineReady = true;
    render(<PwaPrompt />);
    expect(screen.getByRole('status')).toHaveTextContent('sin conexión');
    expect(screen.queryByRole('button', { name: 'Recargar' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(sw.setOfflineReady).toHaveBeenCalledWith(false);
  });

  it('ofrece recargar cuando hay una versión nueva', async () => {
    sw.needRefresh = true;
    render(<PwaPrompt />);
    expect(screen.getByRole('status')).toHaveTextContent('versión nueva');

    await userEvent.click(screen.getByRole('button', { name: 'Recargar' }));
    expect(sw.updateServiceWorker).toHaveBeenCalledWith(true);
  });
});

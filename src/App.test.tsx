import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

describe('App', () => {
  afterEach(() => vi.restoreAllMocks());

  it('muestra el título y el estado de conexión', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PWA Template');
    expect(screen.getByText('Con conexión')).toBeInTheDocument();
  });

  it('indica cuando no hay conexión', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(<App />);
    expect(screen.getByText('Sin conexión')).toBeInTheDocument();
  });
});

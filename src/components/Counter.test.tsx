import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Counter } from './Counter';

describe('Counter', () => {
  it('suma y reinicia', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    const reset = screen.getByRole('button', { name: 'Reiniciar' });
    expect(reset).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Sumar' }));
    await user.click(screen.getByRole('button', { name: 'Sumar' }));
    expect(screen.getByText('2')).toBeInTheDocument();

    await user.click(reset);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

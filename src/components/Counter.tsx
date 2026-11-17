import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <section className="card" aria-labelledby="counter-title">
      <h2 id="counter-title">Estado local</h2>
      <p>
        Pulsaciones: <output aria-live="polite">{count}</output>
      </p>
      <div className="actions">
        <button type="button" className="button" onClick={() => setCount((c) => c + 1)}>
          Sumar
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setCount(0)}
          disabled={count === 0}
        >
          Reiniciar
        </button>
      </div>
    </section>
  );
}

import { Counter } from './components/Counter';
import { PwaPrompt } from './components/PwaPrompt';
import { appName } from './config';
import { useOnlineStatus } from './hooks/useOnlineStatus';

export function App() {
  const online = useOnlineStatus();

  return (
    <div className="page">
      <header className="header">
        <h1>{appName}</h1>
        <p className="status" data-online={online}>
          {online ? 'Con conexión' : 'Sin conexión'}
        </p>
      </header>
      <main className="content">
        <p>
          Pantalla de ejemplo. Sustituye <code>src/App.tsx</code> por tu aplicación.
        </p>
        <Counter />
      </main>
      <PwaPrompt />
    </div>
  );
}

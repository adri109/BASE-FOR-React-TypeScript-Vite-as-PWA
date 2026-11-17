import { MapScreen } from './map/MapScreen';
import { isBackendConfigured } from './lib/supabase';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">App Template</h1>
        <p className="app-badge" data-testid="backend-status">
          Backend: {isBackendConfigured ? 'configurado' : 'sin configurar'}
        </p>
      </header>
      <MapScreen />
    </div>
  );
}

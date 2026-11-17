import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function PwaPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // El navegador solo busca un SW nuevo al navegar; una PWA instalada puede
      // pasar días abierta sin hacerlo, así que se comprueba de forma periódica.
      if (registration) setInterval(() => void registration.update(), UPDATE_CHECK_INTERVAL_MS);
    },
  });

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="toast" role="status">
      <p>
        {needRefresh ? 'Hay una versión nueva disponible.' : 'La app ya funciona sin conexión.'}
      </p>
      <div className="actions">
        {needRefresh && (
          <button type="button" className="button" onClick={() => void updateServiceWorker(true)}>
            Recargar
          </button>
        )}
        <button type="button" className="button button-secondary" onClick={close}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

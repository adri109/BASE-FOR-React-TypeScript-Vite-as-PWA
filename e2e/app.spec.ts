import { expect, test } from '@playwright/test';

test('muestra la pantalla de ejemplo y el contador funciona', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'PWA Template', level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'Sumar' }).click();
  await expect(page.getByRole('status').filter({ hasText: '1' })).toBeVisible();
});

test('expone el manifest con iconos', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
});

test('sigue cargando sin conexión una vez instalado el service worker', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Recarga para que el SW ya controle la página antes de cortar la red.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'PWA Template', level: 1 })).toBeVisible();
  await expect(page.getByText('Sin conexión')).toBeVisible();
});

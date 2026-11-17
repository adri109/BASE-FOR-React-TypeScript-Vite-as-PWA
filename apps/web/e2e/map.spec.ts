import { expect, test } from '@playwright/test';

test('carga el mapa con el paquete de contenido y lista los nodos', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'App Template', level: 1 })).toBeVisible();
  await expect(page.getByTestId('map-source')).toContainText('Fuente: content');

  const list = page.getByRole('list', { name: 'Nodos del mapa' });
  if (!(await list.isVisible())) await page.getByRole('button', { name: 'Lista' }).click();
  await expect(list.getByRole('button')).toHaveCount(4);
});

test('seleccionar un nodo muestra su detalle y respeta el filtro de rama', async ({ page }) => {
  await page.goto('/?nodes=48');
  if (!(await page.getByRole('list', { name: 'Nodos del mapa' }).isVisible())) {
    await page.getByRole('button', { name: 'Lista' }).click();
  }

  await page
    .getByRole('group', { name: 'Filtrar por rama' })
    .getByRole('button', { name: 'Vocabulario' })
    .click();
  const items = page.getByRole('list', { name: 'Nodos del mapa' }).getByRole('button');
  await expect(items).toHaveCount(12);

  await items.first().click();
  await expect(page.getByRole('region', { name: 'Detalle del nodo' })).toContainText('Vocabulario');
});

test('sin desbordamiento horizontal', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('dibuja el canvas de PixiJS cuando hay WebGL', async ({ page }) => {
  await page.goto('/');
  const unsupported = page.getByText('WebGL no disponible');
  const canvas = page.getByTestId('map-canvas').locator('canvas');
  await expect(canvas.or(unsupported)).toBeVisible({ timeout: 10_000 });
});

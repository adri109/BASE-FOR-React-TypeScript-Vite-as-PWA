import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPacks } from './build';
import { loadContent } from './load';
import { syncSchemas } from './schema';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const contentDir = path.join(root, 'content');
const schemaDir = path.join(contentDir, 'schema');
const packsDir = path.join(root, 'apps/web/public/content');

async function validate() {
  const { bundle, issues } = await loadContent(contentDir);
  if (issues.length > 0) {
    for (const i of issues) console.error(`✗ ${path.relative(root, i.where)}: ${i.message}`);
    console.error(`\n${issues.length} problema(s) en el contenido.`);
    process.exit(1);
  }
  const exercises = bundle.exerciseFiles.reduce((n, f) => n + f.exercises.length, 0);
  console.log(`OK: ${bundle.themes.length} temas, ${exercises} ejercicios.`);
  return bundle;
}

const [command, ...flags] = process.argv.slice(2);

switch (command) {
  case 'validate':
    await validate();
    break;
  case 'schema': {
    const check = flags.includes('--check');
    const stale = await syncSchemas(schemaDir, check);
    if (stale.length > 0) {
      console.error(`Esquemas desactualizados: ${stale.join(', ')}. Ejecuta: pnpm content:schema`);
      process.exit(1);
    }
    console.log(
      check ? 'Esquemas al día.' : `Esquemas escritos en ${path.relative(root, schemaDir)}.`,
    );
    break;
  }
  case 'build': {
    const bundle = await validate();
    const files = await buildPacks(bundle, packsDir);
    console.log(`Generados ${files.length} ficheros en ${path.relative(root, packsDir)}.`);
    break;
  }
  default:
    console.error('Uso: cli.ts <validate|schema [--check]|build>');
    process.exit(2);
}

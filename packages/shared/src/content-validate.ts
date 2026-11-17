import type { ExerciseFile, Theme } from './content-schema';

export interface ContentBundle {
  themes: Theme[];
  exerciseFiles: ExerciseFile[];
}

export interface ContentIssue {
  where: string;
  message: string;
}

/** Validación entre ficheros: lo que el esquema de un único documento no puede expresar. */
export function validateBundle(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const themeIds = new Set<string>();

  for (const theme of bundle.themes) {
    if (themeIds.has(theme.id)) {
      issues.push({ where: theme.id, message: 'id de tema duplicado' });
    }
    themeIds.add(theme.id);
  }

  for (const theme of bundle.themes) {
    for (const pre of theme.prerequisites) {
      if (!themeIds.has(pre)) {
        issues.push({ where: theme.id, message: `prerrequisito inexistente: ${pre}` });
      }
      if (pre === theme.id) {
        issues.push({ where: theme.id, message: 'un tema no puede ser prerrequisito de sí mismo' });
      }
    }
  }

  issues.push(...findCycles(bundle.themes));

  const filesByTheme = new Set<string>();
  const exerciseIds = new Set<string>();
  for (const file of bundle.exerciseFiles) {
    if (!themeIds.has(file.theme)) {
      issues.push({ where: file.theme, message: 'ejercicios de un tema inexistente' });
    }
    if (filesByTheme.has(file.theme)) {
      issues.push({ where: file.theme, message: 'más de un fichero de ejercicios para el tema' });
    }
    filesByTheme.add(file.theme);

    for (const ex of file.exercises) {
      const key = `${file.theme}/${ex.id}`;
      if (exerciseIds.has(key)) issues.push({ where: key, message: 'id de ejercicio duplicado' });
      exerciseIds.add(key);

      if (ex.type === 'multiple_choice' && ex.answer >= ex.options.length) {
        issues.push({ where: key, message: 'answer fuera del rango de options' });
      }
    }
  }

  for (const id of themeIds) {
    if (!filesByTheme.has(id)) issues.push({ where: id, message: 'tema sin ejercicios' });
  }

  return issues;
}

function findCycles(themes: Theme[]): ContentIssue[] {
  const deps = new Map(themes.map((t) => [t.id, t.prerequisites]));
  const state = new Map<string, 'visiting' | 'done'>();
  const issues: ContentIssue[] = [];

  const visit = (id: string, path: string[]): void => {
    const s = state.get(id);
    if (s === 'done') return;
    if (s === 'visiting') {
      issues.push({ where: id, message: `ciclo de prerrequisitos: ${[...path, id].join(' -> ')}` });
      return;
    }
    state.set(id, 'visiting');
    for (const dep of deps.get(id) ?? []) {
      if (deps.has(dep)) visit(dep, [...path, id]);
    }
    state.set(id, 'done');
  };

  for (const id of deps.keys()) visit(id, []);
  return issues;
}

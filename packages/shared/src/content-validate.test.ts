import { describe, expect, it } from 'vitest';
import { exerciseFileSchema, themeSchema } from './content-schema';
import { validateBundle, type ContentBundle } from './content-validate';

const theme = (id: string, prerequisites: string[] = []) =>
  themeSchema.parse({
    id,
    level: 'B2',
    branch: 'grammar',
    title: id,
    summary: 'x',
    prerequisites,
    explanation: 'x',
  });

const exercises = (themeId: string) =>
  exerciseFileSchema.parse({
    theme: themeId,
    exercises: [{ id: 'q1', type: 'multiple_choice', prompt: '?', options: ['a', 'b'], answer: 1 }],
  });

const bundle = (over: Partial<ContentBundle> = {}): ContentBundle => ({
  themes: [theme('a'), theme('b', ['a'])],
  exerciseFiles: [exercises('a'), exercises('b')],
  ...over,
});

describe('themeSchema', () => {
  it('rechaza ids que no son kebab-case', () => {
    expect(themeSchema.safeParse({ ...theme('a'), id: 'Not Valid' }).success).toBe(false);
  });

  it('rechaza claves desconocidas', () => {
    expect(themeSchema.safeParse({ ...theme('a'), extra: 1 }).success).toBe(false);
  });
});

describe('exerciseFileSchema', () => {
  it('exige el marcador ___ en fill_blank', () => {
    const res = exerciseFileSchema.safeParse({
      theme: 'a',
      exercises: [
        { id: 'q', type: 'fill_blank', prompt: 'p', sentence: 'sin hueco', accepted: ['x'] },
      ],
    });
    expect(res.success).toBe(false);
  });
});

describe('validateBundle', () => {
  it('acepta un bundle coherente', () => {
    expect(validateBundle(bundle())).toEqual([]);
  });

  it('detecta prerrequisitos inexistentes', () => {
    const issues = validateBundle(bundle({ themes: [theme('a', ['zzz']), theme('b')] }));
    expect(issues.map((i) => i.message)).toContain('prerrequisito inexistente: zzz');
  });

  it('detecta ciclos de prerrequisitos', () => {
    const issues = validateBundle(bundle({ themes: [theme('a', ['b']), theme('b', ['a'])] }));
    expect(issues.some((i) => i.message.startsWith('ciclo de prerrequisitos'))).toBe(true);
  });

  it('detecta temas sin ejercicios', () => {
    const issues = validateBundle(bundle({ exerciseFiles: [exercises('a')] }));
    expect(issues).toContainEqual({ where: 'b', message: 'tema sin ejercicios' });
  });

  it('detecta answer fuera de rango', () => {
    const bad = exerciseFileSchema.parse({
      theme: 'a',
      exercises: [
        { id: 'q1', type: 'multiple_choice', prompt: '?', options: ['a', 'b'], answer: 5 },
      ],
    });
    const issues = validateBundle(bundle({ exerciseFiles: [bad, exercises('b')] }));
    expect(issues).toContainEqual({ where: 'a/q1', message: 'answer fuera del rango de options' });
  });
});

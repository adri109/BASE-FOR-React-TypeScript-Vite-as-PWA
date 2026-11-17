import { z } from 'zod';
import { BRANCHES, LEVELS } from './taxonomy';

const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'kebab-case en minúsculas (a-z, 0-9, guiones)');

const text = z.string().trim().min(1);

export const commonErrorSchema = z.strictObject({
  wrong: text,
  right: text,
  note: text.optional(),
});

export const themeSchema = z.strictObject({
  id: slug,
  level: z.enum(LEVELS),
  branch: z.enum(BRANCHES),
  title: text.max(80),
  summary: text.max(240),
  prerequisites: z.array(slug).default([]),
  explanation: text,
  commonErrors: z.array(commonErrorSchema).default([]),
});
export type Theme = z.infer<typeof themeSchema>;

const exerciseBase = {
  id: slug,
  prompt: text,
  explanation: text.optional(),
};

export const multipleChoiceSchema = z.strictObject({
  ...exerciseBase,
  type: z.literal('multiple_choice'),
  options: z.array(text).min(2).max(6),
  answer: z.number().int().nonnegative(),
});

export const fillBlankSchema = z.strictObject({
  ...exerciseBase,
  type: z.literal('fill_blank'),
  /** Texto con un hueco marcado como `___`. */
  sentence: text.refine((s) => s.includes('___'), 'debe contener el marcador ___'),
  accepted: z.array(text).min(1),
});

export const reorderSchema = z.strictObject({
  ...exerciseBase,
  type: z.literal('reorder'),
  /** Palabras en el orden correcto; el cliente las baraja. */
  words: z.array(text).min(2),
});

export const exerciseSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  fillBlankSchema,
  reorderSchema,
]);
export type Exercise = z.infer<typeof exerciseSchema>;

export const exerciseFileSchema = z.strictObject({
  theme: slug,
  exercises: z.array(exerciseSchema).min(1),
});
export type ExerciseFile = z.infer<typeof exerciseFileSchema>;

export const mapPackSchema = z.strictObject({
  nodes: z.array(
    z.strictObject({
      id: slug,
      title: text,
      level: z.enum(LEVELS),
      branch: z.enum(BRANCHES),
      prerequisites: z.array(slug),
      status: z.enum(['locked', 'active', 'mastered']),
    }),
  ),
});
export type MapPack = z.infer<typeof mapPackSchema>;

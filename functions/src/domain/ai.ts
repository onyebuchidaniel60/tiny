import { z } from 'zod';
import { DomainError } from '../shared/contracts';

const phoneLike = /(?:\+?234|0)[\s-]?[789][01]\d[\s-]?\d{3}[\s-]?\d{4}/;
const emailLike = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export const lessonAssistSchema = z.object({
  title: z.string().min(1).max(140),
  objectiveRefs: z.array(z.string().min(1).max(80)).max(8),
  engage: z.string().min(1).max(1200),
  explore: z.string().min(1).max(1200),
  explain: z.string().min(1).max(1200),
  elaborate: z.string().min(1).max(1200),
  evaluate: z.array(z.string().min(1).max(400)).min(1).max(8),
  materials: z.array(z.string().min(1).max(120)).max(20),
  cautions: z.array(z.string().max(240)).max(8),
  locale: z.string().min(2).max(8),
  sourceDisclaimer: z.string().min(1).max(240),
});

export const teacherTipSchema = z.object({
  strategyTitle: z.string().min(1).max(140),
  steps: z.array(z.string().min(1).max(300)).min(1).max(6),
  whyItMayHelp: z.string().min(1).max(600),
  whenToUse: z.string().min(1).max(400),
  limitations: z.array(z.string().max(240)).max(6),
});

export const rewrittenFeedbackSchema = z.object({
  parentFriendlyMessage: z.string().min(1).max(600),
  homeActivity: z.string().max(240).optional(),
  locale: z.string().min(2).max(8),
});

export function assertDeidentified(text: string): void {
  if (phoneLike.test(text)) throw new DomainError('AI_PII_REJECTED', 'AI input must not contain a phone number.');
  if (emailLike.test(text)) throw new DomainError('AI_PII_REJECTED', 'AI input must not contain an email address.');
  if (/\b(pupil|student)[_-]?[a-z0-9]{4,}\b/i.test(text)) {
    throw new DomainError('AI_PII_REJECTED', 'AI input must not contain a pupil identifier.');
  }
}

export function parseAiJson<T>(schema: z.ZodSchema<T>, raw: string): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new DomainError('AI_OUTPUT_REJECTED', 'The model did not return valid JSON.');
  }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new DomainError('AI_OUTPUT_REJECTED', 'The model output did not match the schema.');
  return result.data;
}

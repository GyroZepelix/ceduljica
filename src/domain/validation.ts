import { z } from 'zod';
import {
  MAX_NICKNAME_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_ROUND_PROMPT_LENGTH,
} from '../shared/constants.js';
import { RoomError } from './errors.js';

const nicknameSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1).max(MAX_NICKNAME_LENGTH));

const noteSchema = z.string().max(MAX_NOTE_LENGTH);
const roundPromptSchema = z
  .string()
  .refine((value) => !/[\r\n]/.test(value))
  .transform((value) => value.trim())
  .pipe(z.string().max(MAX_ROUND_PROMPT_LENGTH));
const idSchema = z.string().uuid();

export function parseNickname(value: unknown): string {
  return parse(nicknameSchema, value, 'Nickname must be 1 to 40 characters after trimming.');
}

export function parseDraft(value: unknown): string {
  return parse(noteSchema, value, 'Note must be plain text of at most 500 characters.').replaceAll(
    '\r\n',
    '\n',
  );
}

export function parseRoundPrompt(value: unknown): string {
  return parse(
    roundPromptSchema,
    value === undefined ? '' : value,
    'Round prompt must be a single line of at most 200 characters.',
  );
}

export function parseParticipantId(value: unknown): string {
  return parse(idSchema, value, 'Participant id is invalid.');
}

function parse<T>(schema: z.ZodType<T>, value: unknown, message: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new RoomError('invalid_input', message);
  }
  return result.data;
}

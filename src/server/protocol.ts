import { z } from 'zod';

const requestId = z.string().min(1).max(100);

export const clientCommandSchema = z.discriminatedUnion('type', [
  z.object({ id: requestId, type: z.literal('begin'), prompt: z.unknown().optional() }).strict(),
  z.object({ id: requestId, type: z.literal('save_draft'), body: z.unknown() }).strict(),
  z.object({ id: requestId, type: z.literal('ready') }).strict(),
  z.object({ id: requestId, type: z.literal('edit') }).strict(),
  z.object({ id: requestId, type: z.literal('remove'), participantId: z.unknown() }).strict(),
  z.object({ id: requestId, type: z.literal('replay'), prompt: z.unknown().optional() }).strict(),
  z.object({ id: requestId, type: z.literal('delete_room') }).strict(),
  z.object({ id: requestId, type: z.literal('ping') }).strict(),
]);

export type ClientCommand = z.infer<typeof clientCommandSchema>;

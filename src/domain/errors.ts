export type RoomErrorCode =
  | 'invalid_input'
  | 'room_not_found'
  | 'session_not_found'
  | 'room_full'
  | 'forbidden'
  | 'invalid_phase'
  | 'not_active'
  | 'not_ready'
  | 'already_ready'
  | 'insufficient_participants';

export class RoomError extends Error {
  constructor(
    readonly code: RoomErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'RoomError';
  }
}

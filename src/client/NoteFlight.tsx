import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { RoomProjection } from '../domain/types.js';

interface Flight {
  direction: 'in' | 'out';
  roomId: string;
  roundId: string | null;
  phase: RoomProjection['phase'];
}

/** A blank paper only: never retains private text, controls, or a previous editor. */
export function NoteFlight({ room, connection }: {
  room: RoomProjection;
  connection: 'connecting' | 'online' | 'offline';
}): ReactNode {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [flight, setFlight] = useState<Flight | null>(null);
  const previous = useRef({ roomId: room.roomId, roundId: room.roundId, phase: room.phase, hasNote: !!room.ownNote });
  const lastSnapshot = useRef(room);
  const continuous = useRef(connection === 'online');

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = (): void => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    const prior = previous.current;
    const sameRoom = prior.roomId === room.roomId;
    const changed = !sameRoom || prior.roundId !== room.roundId || prior.phase !== room.phase;
    if (connection !== 'online') continuous.current = false;
    if (changed || reduced || connection !== 'online') {
      let direction: Flight['direction'] | null = null;
      if (sameRoom && !reduced && connection === 'online') {
        if (room.phase === 'writing' && room.ownNote && room.roundId !== prior.roundId) direction = 'in';
        if (continuous.current && prior.hasNote && prior.phase === 'writing' &&
            room.phase === 'reveal' && prior.roundId === room.roundId) direction = 'out';
      }
      setFlight(direction ? { direction, roomId: room.roomId, roundId: room.roundId, phase: room.phase } : null);
    }
    // An online restoration snapshot re-establishes continuity, never a socket-open event alone.
    if (lastSnapshot.current !== room && connection === 'online') continuous.current = true;
    lastSnapshot.current = room;
    previous.current = { roomId: room.roomId, roundId: room.roundId, phase: room.phase, hasNote: !!room.ownNote };
  }, [room, connection, reduced]);

  useEffect(() => {
    if (!flight) return;
    const timer = window.setTimeout(() => setFlight(null), 520);
    return () => window.clearTimeout(timer);
  }, [flight]);

  if (!flight || reduced || flight.roomId !== room.roomId || flight.roundId !== room.roundId || flight.phase !== room.phase) return null;
  return <div aria-hidden="true" className={`note-flight note-flight-${flight.direction}`}><div className="flight-paper" /></div>;
}

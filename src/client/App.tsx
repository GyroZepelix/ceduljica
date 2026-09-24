import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { RoomProjection } from '../domain/types.js';
import { ApiError, getSession, RoomRealtime } from './api.js';
import { Landing } from './Landing.js';
import { RoomScreen } from './RoomScreen.js';
import { clearSession, loadSession, saveSession } from './storage.js';
import type { CreatedSession, RoomCommand, StoredSession, TerminalReason } from './types.js';
import { useSound } from './use-sound.js';

export function App(): ReactNode {
  const [session, setSession] = useState<StoredSession | null>(loadSession);
  const [room, setRoom] = useState<RoomProjection | null>(null);
  const [connection, setConnection] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [terminal, setTerminal] = useState<TerminalReason | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const realtimeRef = useRef<RoomRealtime | null>(null);
  const roomRef = useRef(room);
  roomRef.current = room;
  const priorConnection = useRef<'connecting' | 'online' | 'offline'>('connecting');
  const priorPhase = useRef<RoomProjection['phase'] | null>(null);
  const sound = useSound();
  const playRef = useRef(sound.play);
  playRef.current = sound.play;

  const endRoom = useCallback((reason: TerminalReason): void => {
    realtimeRef.current?.stop();
    realtimeRef.current = null;
    clearSession();
    setSession(null);
    setRoom(null);
    setTerminal(reason);
  }, []);

  useEffect(() => {
    if (!session || terminal) return;
    let cancelled = false;
    const realtime = new RoomRealtime(session, {
      onSnapshot: (nextRoom) => {
        if (cancelled) return;
        if (priorPhase.current !== null && priorPhase.current !== 'reveal' && nextRoom.phase === 'reveal') {
          playRef.current('reveal');
        }
        priorPhase.current = nextRoom.phase;
        if (roomRef.current === null) window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
        setRoom(nextRoom);
        setError(null);
      },
      onStatus: (nextStatus) => {
        if (cancelled) return;
        if (priorConnection.current === 'offline' && nextStatus === 'online') {
          setAnnouncement('Back online. Room status updated.');
        } else if (nextStatus === 'offline') {
          setAnnouncement('Connection lost. Trying again.');
        }
        priorConnection.current = nextStatus;
        setConnection(nextStatus);
      },
      onTerminal: endRoom,
      onProblem: (problem) => setError(problem.message),
    });
    realtimeRef.current = realtime;
    realtime.start();
    if (!roomRef.current) {
      void getSession(session.sessionToken)
        .then((projection) => {
          if (!cancelled) {
            priorPhase.current = projection.phase;
            if (roomRef.current === null) window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
            setRoom(projection);
          }
        })
        .catch(() => {
          if (!cancelled) endRoom('ended');
        });
    }
    return () => {
      cancelled = true;
      realtime.stop();
      if (realtimeRef.current === realtime) realtimeRef.current = null;
    };
  }, [endRoom, session, terminal]);

  const enter = useCallback((created: CreatedSession): void => {
    const next: StoredSession = created.credentials;
    saveSession(next);
    setTerminal(null);
    setSession(next);
    setRoom(created.projection);
    priorPhase.current = created.projection.phase;
    window.history.replaceState(null, '', `/room/${created.credentials.roomCode}`);
    window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
  }, []);

  const command = useCallback(async (value: RoomCommand): Promise<void> => {
    setError(null);
    try {
      const realtime = realtimeRef.current;
      if (!realtime) throw new ApiError({ code: 'offline', message: 'Connection lost — trying again.' });
      await realtime.send(value);
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : 'That action did not reach the room.';
      setError(message);
      throw caught;
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    if (!session) return;
    try {
      setRoom(await getSession(session.sessionToken));
    } catch {
      endRoom('ended');
    }
  }, [endRoom, session]);

  function returnHome(): void {
    sound.play('tap');
    setTerminal(null);
    setConnection('connecting');
    setAnnouncement('');
    window.history.replaceState(null, '', '/');
  }

  if (terminal) {
    const content = terminalContent(terminal);
    return (
      <div className="app-shell terminal-shell">
        <main className="terminal-card paper-card" aria-live="assertive">
          <div aria-hidden="true" className="peel peel-sad"><span /></div>
          <h1 tabIndex={-1}>{content.title}</h1>
          <p>{content.body}</p>
          <button className="button primary" onClick={returnHome} type="button">{content.action}</button>
        </main>
      </div>
    );
  }

  if (session && room) {
    return (
      <RoomScreen
        announcement={announcement}
        connection={connection}
        error={error}
        muted={sound.muted}
        onCommand={command}
        onReadySound={() => sound.play('ready')}
        onRefresh={refresh}
        onTap={() => sound.play('tap')}
        onToggleMuted={sound.toggle}
        room={room}
      />
    );
  }

  return (
    <Landing
      initialRoomCode={roomCodeFromLocation()}
      muted={sound.muted}
      onEntered={enter}
      onTap={() => sound.play('tap')}
      onToggleMuted={sound.toggle}
    />
  );
}

function roomCodeFromLocation(): string {
  const match = /^\/room\/([A-Za-z0-9_-]{20,64})\/?$/.exec(window.location.pathname);
  return match?.[1] ?? new URLSearchParams(window.location.search).get('room') ?? '';
}

function terminalContent(reason: TerminalReason): { title: string; body: string; action: string } {
  switch (reason) {
    case 'removed':
      return { title: "You've been removed from this room.", body: 'Your session can no longer act in this room.', action: 'Return home' };
    case 'deleted':
      return { title: 'This room was deleted by its owner.', body: 'Its notes are gone.', action: 'Return home' };
    case 'expired':
      return { title: 'This room expired after 24 hours without activity.', body: 'Start fresh with a new private room.', action: 'Create a new room' };
    case 'ended':
      return { title: 'This room is no longer available.', body: 'It may have ended, expired, or your participant session may have been removed.', action: 'Return home' };
  }
}

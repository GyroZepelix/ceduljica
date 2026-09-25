import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ApiError, createRoom, joinRoom } from './api.js';
import { Mascot, PlazaBackdrop } from './Artwork.js';
import { HowTo } from './HowTo.js';
import { Header } from './RoomScreen.js';
import type { CreatedSession } from './types.js';

interface LandingProps {
  muted: boolean;
  onToggleMuted: () => void;
  onEntered: (session: CreatedSession) => void;
  onTap: () => void;
  initialRoomCode?: string;
}

export function Landing({ muted, onToggleMuted, onEntered, onTap, initialRoomCode = '' }: LandingProps): ReactNode {
  const [showHowTo, setShowHowTo] = useState(false);
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [roomInput, setRoomInput] = useState(initialRoomCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function submit(action: () => Promise<CreatedSession>): Promise<void> {
    onTap();
    setBusy(true);
    setError(null);
    try {
      onEntered(await action());
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Ceduljica could not reach the room service.');
    } finally {
      setBusy(false);
    }
  }

  function onCreate(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submit(async () => await createRoom(createName));
  }

  function onJoin(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const roomCode = parseRoomCode(roomInput);
    if (!roomCode) {
      setError('Enter the private room link or code you received.');
      return;
    }
    void submit(async () => await joinRoom(roomCode, joinName));
  }

  return (
    <div className="app-shell landing-shell">
      <PlazaBackdrop />
      <Header
        muted={muted}
        onHowTo={() => { onTap(); setShowHowTo(true); }}
        onToggleMuted={onToggleMuted}
      />
      <main className="landing-main">
        <section className="hero-copy">
          <Mascot />
          <p className="eyebrow">A private little plaza for big ideas</p>
          <h1>Write it. Ready it. Reveal together.</h1>
          <p>Make one shared room for 2–12 people. No accounts, no public directory, just your invite link.</p>
        </section>
        {error ? <div className="error-summary" ref={errorRef} role="alert" tabIndex={-1}>{error}</div> : null}
        <div className="entry-grid">
          <form className="paper-card entry-card create-card" onSubmit={onCreate}>
            <span aria-hidden="true" className="card-number">01</span>
            <h2>Start a new room</h2>
            <label htmlFor="create-name">Your display name</label>
            <input
              autoComplete="nickname"
              id="create-name"
              maxLength={40}
              onChange={(event) => setCreateName(event.target.value)}
              required
              value={createName}
            />
            <p className="supporting">This is a display name, not a sign-in.</p>
            <button className="button primary" disabled={busy} type="submit">Create a room</button>
          </form>
          <form className="paper-card entry-card join-card" onSubmit={onJoin}>
            <span aria-hidden="true" className="card-number">02</span>
            <h2>Join your people</h2>
            <label htmlFor="room-link">Private room link or code</label>
            <input
              autoCapitalize="none"
              autoCorrect="off"
              id="room-link"
              onChange={(event) => setRoomInput(event.target.value)}
              required
              spellCheck="false"
              value={roomInput}
            />
            <label htmlFor="join-name">Your display name</label>
            <input
              autoComplete="nickname"
              id="join-name"
              maxLength={40}
              onChange={(event) => setJoinName(event.target.value)}
              required
              value={joinName}
            />
            <button className="button mint" disabled={busy} type="submit">Join room</button>
          </form>
        </div>
      </main>
      {showHowTo ? <HowTo onClose={() => setShowHowTo(false)} onTap={onTap} /> : null}
    </div>
  );
}

export function parseRoomCode(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{20,64}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed, window.location.origin);
    const match = /^\/room\/([A-Za-z0-9_-]{20,64})\/?$/.exec(url.pathname);
    return match?.[1] ?? url.searchParams.get('room');
  } catch {
    return null;
  }
}

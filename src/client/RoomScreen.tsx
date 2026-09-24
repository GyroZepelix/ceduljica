import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ParticipantSummary, RoomProjection } from '../domain/types.js';
import { HowTo } from './HowTo.js';
import { Modal } from './Modal.js';
import type { RoomCommand } from './types.js';

interface RoomScreenProps {
  room: RoomProjection;
  connection: 'connecting' | 'online' | 'offline';
  announcement: string;
  error: string | null;
  muted: boolean;
  onToggleMuted: () => void;
  onCommand: (command: RoomCommand) => Promise<void>;
  onRefresh: () => Promise<void>;
  onTap: () => void;
  onReadySound: () => void;
}

export function RoomScreen(props: RoomScreenProps): ReactNode {
  const { room, connection, announcement, error, muted, onToggleMuted, onCommand, onRefresh, onTap, onReadySound } = props;
  const [showHowTo, setShowHowTo] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transferMessage, setTransferMessage] = useState('');
  const phaseHeading = useRef<HTMLHeadingElement>(null);
  const previousPhase = useRef(room.phase);
  const previousOwner = useRef(ownerName(room));

  useEffect(() => {
    if (previousPhase.current !== room.phase) {
      previousPhase.current = room.phase;
      phaseHeading.current?.focus();
    }
  }, [room.phase]);

  useEffect(() => {
    const next = ownerName(room);
    if (previousOwner.current !== next) {
      previousOwner.current = next;
      setTransferMessage(room.self.isOwner ? 'You are now the owner.' : `${next} is now the owner.`);
    }
  }, [room.participants, room.self.isOwner]);

  async function act(command: RoomCommand, sound: 'tap' | 'ready' = 'tap'): Promise<boolean> {
    if (command.type !== 'save_draft') onTap();
    setBusy(true);
    try {
      await onCommand(command);
      if (sound === 'ready') onReadySound();
      return true;
    } catch {
      await onRefresh();
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell room-shell">
      <Header
        muted={muted}
        onHowTo={() => { onTap(); setShowHowTo(true); }}
        onToggleMuted={onToggleMuted}
        phase={room.phase}
      />
      {connection !== 'online' ? (
        <div className="connection-banner" role="status">
          <span aria-hidden="true" className="spinner" /> Connection lost — trying again
        </div>
      ) : null}
      <div aria-atomic="true" aria-live="polite" className="sr-only">{announcement} {transferMessage}</div>
      {transferMessage ? <div className="status-banner" role="status">{transferMessage}</div> : null}
      {error ? <div className="error-summary" role="alert">{error}</div> : null}
      <main className="room-main">
        <section className="phase-card paper-card">
          <PhaseContent
            busy={busy || connection !== 'online'}
            headingRef={phaseHeading}
            onAct={act}
            onDelete={() => { onTap(); setShowDelete(true); }}
            room={room}
          />
          {room.self.isOwner && room.phase !== 'reveal' ? (
            <div aria-label="Room management" className="owner-controls room-management">
              <h2>Room management</h2>
              <button className="button danger" disabled={busy} onClick={() => { onTap(); setShowDelete(true); }} type="button">⌫ Delete room</button>
            </div>
          ) : null}
        </section>
        {room.phase !== 'reveal' ? <ParticipantRail onAct={act} room={room} /> : null}
      </main>
      <ParticipantDisclosure onAct={act} room={room} />
      {showHowTo ? <HowTo onClose={() => setShowHowTo(false)} onTap={onTap} /> : null}
      {showDelete ? (
        <Modal initialFocus="marked" title="Delete this room?" onClose={() => setShowDelete(false)}>
          <p>The room and every note will be permanently deleted for everyone. No undo.</p>
          <div className="modal-actions">
            <button className="button secondary" data-autofocus onClick={() => { onTap(); setShowDelete(false); }} type="button">
              Keep room
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={() => { setShowDelete(false); void act({ type: 'delete_room' }); }}
              type="button"
            >
              Delete room permanently
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

interface HeaderProps {
  muted: boolean;
  phase?: RoomProjection['phase'];
  onHowTo: () => void;
  onToggleMuted: () => void;
}

export function Header({ muted, phase, onHowTo, onToggleMuted }: HeaderProps): ReactNode {
  return (
    <header className="site-header">
      <a aria-label="Ceduljica home" className="brand" href="/">
        <span aria-hidden="true" className="brand-mark"><span /></span>
        <span>Ceduljica</span>
      </a>
      {phase ? <span className="phase-tab">{phase}</span> : null}
      <nav aria-label="Utilities">
        <button className="quiet-button" onClick={onHowTo} type="button">How to use</button>
        <button
          aria-label={muted ? 'Muted' : 'Sound on'}
          aria-pressed={muted}
          className="sound-toggle"
          onClick={onToggleMuted}
          type="button"
        >
          <span aria-hidden="true">{muted ? '◖' : '♪'}</span> <span>{muted ? 'Muted' : 'Sound on'}</span>
        </button>
      </nav>
    </header>
  );
}

interface PhaseContentProps {
  room: RoomProjection;
  busy: boolean;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onAct: (command: RoomCommand, sound?: 'tap' | 'ready') => Promise<boolean>;
  onDelete: () => void;
}

function PhaseContent({ room, busy, headingRef, onAct, onDelete }: PhaseContentProps): ReactNode {
  if (room.phase === 'lobby') return <Lobby busy={busy} headingRef={headingRef} onAct={onAct} room={room} />;
  if (room.phase === 'writing') return <Writing busy={busy} headingRef={headingRef} onAct={onAct} room={room} />;
  return <Reveal busy={busy} headingRef={headingRef} onAct={onAct} onDelete={onDelete} room={room} />;
}

function Lobby({ room, busy, headingRef, onAct }: Omit<PhaseContentProps, 'onDelete'>): ReactNode {
  const connected = room.participants.filter((person) => person.connected).length;
  const invite = `${window.location.origin}/room/${room.roomCode}`;
  const [copyMessage, setCopyMessage] = useState('');
  async function copyInvite(): Promise<void> {
    try {
      await navigator.clipboard.writeText(invite);
      setCopyMessage('Invite link copied.');
    } catch {
      setCopyMessage(`Copy this link: ${invite}`);
    }
  }
  return (
    <>
      <p className="eyebrow">Lobby · room {shortCode(room.roomCode)}</p>
      <h1 ref={headingRef} tabIndex={-1}>Bring your people in</h1>
      <p className="lede">{connected} of 12 people · {connected >= 2 ? 'Minimum met: ready to begin.' : 'Invite one more person to begin.'}</p>
      <div className="invite-box">
        <label htmlFor="invite-link">Private invite link</label>
        <div className="inline-control">
          <input id="invite-link" readOnly value={invite} />
          <button className="button secondary" onClick={() => { void copyInvite(); }} type="button">Copy link</button>
        </div>
        <p aria-live="polite" className="supporting">{copyMessage || 'Anyone with this unlisted link can join.'}</p>
      </div>
      {room.self.isOwner ? (
        <div aria-label="Owner controls" className="owner-controls">
          <h2>Owner controls</h2>
          <button className="button primary" disabled={!room.canBegin || busy} onClick={() => { void onAct({ type: 'begin' }); }} type="button">
            Begin writing
          </button>
          {!room.canBegin ? <p className="supporting">Begin unlocks when 2 connected people are here.</p> : null}
        </div>
      ) : <p className="waiting-copy">Waiting for the owner to begin.</p>}
    </>
  );
}

function Writing({ room, busy, headingRef, onAct }: Omit<PhaseContentProps, 'onDelete'>): ReactNode {
  const isActive = room.self.roundRole === 'active';
  const own = room.ownNote;
  const [draft, setDraft] = useState(own?.body ?? '');
  const lastServerBody = useRef(own?.body ?? '');
  const active = room.participants.filter((person) => person.roundRole === 'active');
  const readyCount = active.filter((person) => person.ready).length;

  useEffect(() => {
    const serverBody = room.ownNote?.body;
    if (serverBody !== undefined && serverBody !== lastServerBody.current) {
      lastServerBody.current = serverBody;
      setDraft(serverBody);
    }
  }, [room.ownNote?.body]);

  useEffect(() => {
    if (!isActive || own?.ready || draft === lastServerBody.current) return;
    const timer = window.setTimeout(() => {
      void onAct({ type: 'save_draft', body: draft });
      lastServerBody.current = draft;
    }, 600);
    return () => window.clearTimeout(timer);
  }, [draft, isActive, onAct, own?.ready]);

  if (!isActive) {
    return (
      <>
        <p className="eyebrow">Writing · you joined mid-round</p>
        <h1 ref={headingRef} tabIndex={-1}>You're in the next round</h1>
        <div className="info-panel"><span aria-hidden="true">⌛</span><p>Watch this round finish. No note is needed from you yet.</p></div>
        <p>{readyCount} of {active.length} active people are ready.</p>
      </>
    );
  }

  if (own?.ready) {
    const remaining = Math.max(active.length - readyCount, 0);
    return (
      <>
        <p className="eyebrow">Writing · {readyCount} of {active.length} ready</p>
        <h1 className="ready-heading" ref={headingRef} tabIndex={-1}><span aria-hidden="true">✓</span> You're ready</h1>
        <p>{remaining === 0 ? 'Reveal is starting.' : `Waiting for ${remaining} more. You can edit until reveal starts.`}</p>
        <blockquote className="own-note-preview">{own.body}</blockquote>
        <button className="button secondary" disabled={busy} onClick={() => { void onAct({ type: 'edit' }); }} type="button">✎ Edit note</button>
      </>
    );
  }

  const countText = draft.length === 500 ? '500 / 500 — limit reached' : `${draft.length} / 500`;
  return (
    <>
      <p className="eyebrow">Writing · {readyCount} of {active.length} ready</p>
      <h1 ref={headingRef} tabIndex={-1}>Write one private note</h1>
      <p className="privacy-note"><span aria-hidden="true">◉</span> Only your note is sent back to you before reveal.</p>
      <label htmlFor="note">Your note</label>
      <textarea
        id="note"
        maxLength={500}
        onChange={(event) => setDraft(event.target.value)}
        rows={9}
        value={draft}
      />
      <p className="counter">{countText}</p>
      <button
        className="button primary ready-button"
        disabled={busy || draft.trim().length === 0}
        onClick={() => {
          void (async () => {
            if (await onAct({ type: 'save_draft', body: draft })) {
              await onAct({ type: 'ready' }, 'ready');
            }
          })();
        }}
        type="button"
      >
        ✓ I'm ready
      </button>
    </>
  );
}

function Reveal({ room, busy, headingRef, onAct, onDelete }: PhaseContentProps): ReactNode {
  const notes = room.revealedNotes ?? [];
  return (
    <>
      <div aria-hidden="true" className="reveal-burst" />
      <p className="eyebrow">Reveal</p>
      <h1 ref={headingRef} tabIndex={-1}>Notes up!</h1>
      <p className="lede">{notes.length} {notes.length === 1 ? 'note' : 'notes'} · everyone sees the same board</p>
      {notes.length >= 9 ? <p className="mobile-note-progress">{notes.length} notes · note 1 of {notes.length} · scroll ↓</p> : null}
      <ol className={`note-board notes-${density(notes.length)}`}>
        {notes.map((note, index) => (
          <li className={`sticky-note note-color-${String(index % 5)}`} key={note.participantId}>
            <p>{note.body}</p>
            <footer>— {note.nickname}</footer>
          </li>
        ))}
      </ol>
      {room.self.isOwner ? (
        <div aria-label="Owner controls" className="owner-controls reveal-controls">
          {room.self.isOwner ? <p className="owner-notice">You are the owner</p> : null}
          <button className="button primary" disabled={!room.canReplay || busy} onClick={() => { void onAct({ type: 'replay' }); }} type="button">Start a new round</button>
          {!room.canReplay ? <p className="supporting">A new round needs 2 connected people.</p> : null}
          <button className="button danger" disabled={busy} onClick={onDelete} type="button">⌫ Delete room</button>
        </div>
      ) : <p className="waiting-copy">Waiting for owner to start a new round.</p>}
    </>
  );
}

function ParticipantRail({ room, onAct }: { room: RoomProjection; onAct: PhaseContentProps['onAct'] }): ReactNode {
  return (
    <aside aria-labelledby="people-heading" className="people-card paper-card">
      <h2 id="people-heading">People ({room.participants.length})</h2>
      <ParticipantList onAct={onAct} room={room} />
      {room.participants.some((person) => !person.connected) ? (
        <p className="disconnect-help">Unfinished work is removed after grace. Ready notes stay eligible.</p>
      ) : null}
    </aside>
  );
}

function ParticipantDisclosure({ room, onAct }: { room: RoomProjection; onAct: PhaseContentProps['onAct'] }): ReactNode {
  return (
    <details aria-label="People" className="people-disclosure paper-card" role="region">
      <summary>People ({room.participants.length})</summary>
      <ParticipantList onAct={onAct} room={room} />
      {room.participants.some((person) => !person.connected) ? (
        <p className="disconnect-help">Unfinished work is removed after grace. Ready notes stay eligible.</p>
      ) : null}
    </details>
  );
}

function ParticipantList({ room, onAct }: { room: RoomProjection; onAct?: PhaseContentProps['onAct'] }): ReactNode {
  return (
    <ul className="people-list">
      {room.participants.map((person) => (
        <ParticipantRow key={person.id} person={person} room={room} {...(onAct ? { onAct } : {})} />
      ))}
    </ul>
  );
}

function ParticipantRow({ room, person, onAct }: { room: RoomProjection; person: ParticipantSummary; onAct?: PhaseContentProps['onAct'] }): ReactNode {
  const [, rerender] = useState(0);
  useEffect(() => {
    if (person.connected || person.disconnectDeadline === null) return;
    const timer = window.setInterval(() => rerender((value) => value + 1), 1_000);
    return () => window.clearInterval(timer);
  }, [person.connected, person.disconnectDeadline]);
  const status = participantStatus(person, room.phase);
  const canRemove = room.self.isOwner && person.id !== room.self.participantId && room.phase !== 'reveal';
  return (
    <li className="person-row">
      <span aria-hidden="true" className={`avatar avatar-${String(person.id.charCodeAt(0) % 4)}`} />
      <span className="person-copy">
        <strong>{person.nickname}{person.id === room.self.participantId ? ' (you)' : ''}</strong>
        <span>{status}</span>
      </span>
      {person.isOwner ? <span className="status-chip">⚿ Owner</span> : null}
      {canRemove && onAct ? (
        <button aria-label={`Remove ${person.nickname}`} className="remove-button" onClick={() => { void onAct({ type: 'remove', participantId: person.id }); }} type="button">Remove</button>
      ) : null}
    </li>
  );
}

function participantStatus(person: ParticipantSummary, phase: RoomProjection['phase']): string {
  if (!person.connected && person.disconnectDeadline !== null) {
    const seconds = Math.max(0, Math.ceil((person.disconnectDeadline - Date.now()) / 1_000));
    return `↯ Reconnecting · ${String(seconds)}s`;
  }
  if (!person.connected) return '↯ Disconnected';
  if (phase === 'writing' && person.roundRole === 'waiting') return '⌛ Next round';
  if (phase === 'writing' && person.ready) return '✓ Ready';
  if (phase === 'writing') return '✎ Writing';
  return '✓ Joined';
}

function ownerName(room: RoomProjection): string {
  return room.participants.find((person) => person.isOwner)?.nickname ?? 'A participant';
}

function shortCode(code: string): string {
  return `${code.slice(0, 5)}…${code.slice(-4)}`;
}

function density(count: number): string {
  if (count === 1) return 'one';
  if (count <= 4) return 'small';
  if (count <= 8) return 'medium';
  return 'dense';
}

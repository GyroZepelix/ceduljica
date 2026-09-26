// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantSummary, RoomProjection } from '../../src/domain/types.js';
import { App } from '../../src/client/App.js';
import { Landing, parseRoomCode } from '../../src/client/Landing.js';
import { RoomScreen } from '../../src/client/RoomScreen.js';
import type { RoomCommand } from '../../src/client/types.js';

const owner: ParticipantSummary = {
  id: 'owner-id',
  avatarSlot: 0,
  nickname: 'Maya',
  connected: true,
  disconnectDeadline: null,
  isOwner: true,
  roundRole: 'waiting',
  ready: false,
};
const guest: ParticipantSummary = {
  id: 'guest-id',
  avatarSlot: 1,
  nickname: 'Jon',
  connected: true,
  disconnectDeadline: null,
  isOwner: false,
  roundRole: 'waiting',
  ready: false,
};

function projection(overrides: Partial<RoomProjection> = {}): RoomProjection {
  return {
    roomId: 'room-id',
    roundId: null,
    roundPrompt: '',
    roomCode: 'abcdefghijklmnopqrstuvwx',
    phase: 'lobby',
    version: 1,
    self: { participantId: owner.id, nickname: owner.nickname, isOwner: true, roundRole: 'waiting' },
    participants: [owner, guest],
    canBegin: true,
    canReplay: false,
    ...overrides,
  };
}

function renderRoom(room: RoomProjection, onCommand: (command: RoomCommand) => Promise<void> = vi.fn(() => Promise.resolve())) {
  const onRefresh = vi.fn(async () => {});
  const result = render(
    <RoomScreen
      announcement=""
      connection="online"
      error={null}
      muted={false}
      onCommand={onCommand}
      onReadySound={() => {}}
      onRefresh={onRefresh}
      onTap={() => {}}
      onToggleMuted={() => {}}
      room={room}
    />,
  );
  return { ...result, onCommand, onRefresh };
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});

describe('entry and modal accessibility', () => {
  it('parses private links and guides five keyboard-accessible steps', async () => {
    const user = userEvent.setup();
    const code = 'abcdefghijklmnopqrstuvwx';
    expect(parseRoomCode(code)).toBe(code);
    expect(parseRoomCode(`https://notes.test/room/${code}`)).toBe(code);
    expect(parseRoomCode('public room')).toBeNull();

    render(
      <Landing muted={false} onEntered={() => {}} onTap={() => {}} onToggleMuted={() => {}} />,
    );
    const opener = screen.getByRole('button', { name: 'How to use' });
    await user.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'How to use Ceduljica' });
    expect(within(dialog).getByText('Step 1 of 5')).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Back' }).hasAttribute('disabled')).toBe(true);
    for (let step = 1; step < 5; step += 1) await user.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(within(dialog).getByText('Reveal together')).toBeTruthy();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('persists the pressed mute preference without requiring audio support', async () => {
    window.localStorage.setItem('ceduljica:muted', 'true');
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    const toggle = screen.getByRole('button', { name: 'Muted' });
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    await user.click(toggle);
    expect(window.localStorage.getItem('ceduljica:muted')).toBe('false');
    unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Sound on' }).getAttribute('aria-pressed')).toBe('false');
  });
});

describe('authoritative room rendering', () => {
  it('sends trimmed optional prompts from blank owner controls for begin and replay', async () => {
    const user = userEvent.setup();
    const beginCommand = vi.fn(() => Promise.resolve());
    renderRoom(projection(), beginCommand);
    const beginPrompt = screen.getByRole('textbox', { name: 'Round prompt (optional)' });
    expect((beginPrompt as HTMLInputElement).value).toBe('');
    expect(beginPrompt.getAttribute('maxlength')).toBe('200');
    await user.type(beginPrompt, '  What made you smile?  ');
    await user.click(screen.getByRole('button', { name: 'Begin writing' }));
    expect(beginCommand).toHaveBeenCalledWith({ type: 'begin', prompt: 'What made you smile?' });
    cleanup();

    const replayCommand = vi.fn(() => Promise.resolve());
    renderRoom(projection({
      phase: 'reveal',
      roundId: 'round-one',
      roundPrompt: 'Previous question',
      revealedNotes: [],
      canBegin: false,
      canReplay: true,
    }), replayCommand);
    const replayPrompt = screen.getByRole('textbox', { name: 'Round prompt (optional)' });
    expect((replayPrompt as HTMLInputElement).value).toBe('');
    await user.type(replayPrompt, '  A new question  ');
    await user.click(screen.getByRole('button', { name: 'Start a new round' }));
    expect(replayCommand).toHaveBeenCalledWith({ type: 'replay', prompt: 'A new question' });
  });

  it('shows plain-text prompts in active, ready, waiting, and reveal views but suppresses blanks', () => {
    const prompt = 'Answer <strong>as plain text</strong>';
    const activeRoom = projection({
      phase: 'writing',
      roundId: 'round-one',
      roundPrompt: prompt,
      self: { participantId: owner.id, nickname: owner.nickname, isOwner: true, roundRole: 'active' },
      participants: [{ ...owner, roundRole: 'active' }, { ...guest, roundRole: 'active' }],
      ownNote: { body: '', ready: false },
      canBegin: false,
    });
    renderRoom(activeRoom);
    let promptRegion = screen.getByRole('region', { name: 'Round prompt' });
    expect(within(promptRegion).getByText(prompt)).toBeTruthy();
    expect(promptRegion.querySelector('strong')).toBeNull();
    cleanup();

    renderRoom({ ...activeRoom, ownNote: { body: 'Ready answer', ready: true } });
    expect(screen.getByRole('region', { name: 'Round prompt' })).toBeTruthy();
    cleanup();

    const waitingRoom = { ...activeRoom, self: { ...activeRoom.self, roundRole: 'waiting' as const } };
    delete waitingRoom.ownNote;
    renderRoom(waitingRoom);
    expect(screen.getByRole('region', { name: 'Round prompt' })).toBeTruthy();
    cleanup();

    const revealRoom: RoomProjection = {
      ...activeRoom,
      phase: 'reveal',
      revealedNotes: [],
      canReplay: true,
    };
    delete revealRoom.ownNote;
    renderRoom(revealRoom);
    promptRegion = screen.getByRole('region', { name: 'Round prompt' });
    expect(within(promptRegion).getByText(prompt)).toBeTruthy();
    cleanup();

    renderRoom({ ...activeRoom, roundPrompt: '' });
    expect(screen.queryByRole('region', { name: 'Round prompt' })).toBeNull();
  });

  it('renders only the participant own draft before reveal and keeps Enter in the editor', () => {
    const room = projection({
      phase: 'writing',
      version: 4,
      self: { participantId: owner.id, nickname: owner.nickname, isOwner: true, roundRole: 'active' },
      participants: [
        { ...owner, roundRole: 'active' },
        { ...guest, roundRole: 'active', ready: true },
      ],
      ownNote: { body: 'my private draft', ready: false },
      canBegin: false,
    });
    const { container } = renderRoom(room);
    const editor = screen.getByRole('textbox', { name: 'Your note' });
    expect((editor as HTMLTextAreaElement).value).toBe('my private draft');
    fireEvent.change(editor, { target: { value: 'line one\nline two' } });
    expect((editor as HTMLTextAreaElement).value).toBe('line one\nline two');
    expect(container.textContent).not.toContain('another participant secret');
    expect(screen.getAllByText('✓ Ready')).toHaveLength(2);
    expect(screen.getByText(/Only your note is sent back/)).toBeTruthy();
  });

  it('renders ready, waiting, reconnect, and server-rejected owner action states', async () => {
    const user = userEvent.setup();
    const readyRoom = projection({
      phase: 'writing',
      self: { participantId: owner.id, nickname: owner.nickname, isOwner: true, roundRole: 'active' },
      participants: [
        { ...owner, roundRole: 'active', ready: true },
        { ...guest, roundRole: 'active', connected: false, disconnectDeadline: Date.now() + 42_000 },
      ],
      ownNote: { body: 'frozen note', ready: true },
      canBegin: false,
    });
    renderRoom(readyRoom);
    expect(screen.getByRole('heading', { name: /You're ready/ })).toBeTruthy();
    expect(screen.getByText('frozen note')).toBeTruthy();
    expect(screen.getAllByText(/Reconnecting · 42s/)).toHaveLength(2);
    expect(screen.getAllByText(/Ready notes stay eligible/)).toHaveLength(2);
    cleanup();

    const rejected = vi.fn(() => Promise.reject(new Error('rejected')));
    const { onRefresh } = renderRoom(projection(), rejected);
    const mobilePeople = screen.getByRole('region', { name: 'People' });
    expect(within(mobilePeople).getByRole('button', { name: 'Remove Jon' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Begin writing' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('focuses the server-confirmed phase heading and renders stable 1-to-12 reveal densities', () => {
    const { rerender } = renderRoom(projection());
    const notes = Array.from({ length: 12 }, (_, index) => ({
      participantId: `p-${String(index)}`,
      avatarSlot: index,
      nickname: `Writer ${String(index + 1)}`,
      body: `Note ${String(index + 1)}`,
    }));
    const reveal = projection({
      phase: 'reveal',
      version: 10,
      revealedNotes: notes,
      canBegin: false,
      canReplay: true,
    });
    rerender(
      <RoomScreen
        announcement=""
        connection="online"
        error={null}
        muted={false}
        onCommand={() => Promise.resolve()}
        onReadySound={() => {}}
        onRefresh={() => Promise.resolve()}
        onTap={() => {}}
        onToggleMuted={() => {}}
        room={reveal}
      />,
    );
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Notes up!' }));
    const board = document.querySelector('.note-board');
    expect(board).not.toBeNull();
    expect(board?.className).toContain('notes-dense');
    expect(board?.querySelectorAll(':scope > li')).toHaveLength(12);
    expect(screen.getByText('12 notes · note 1 of 12 · scroll ↓')).toBeTruthy();
    expect(board?.querySelectorAll('footer').item(11).textContent).toContain('Writer 12');

    rerender(
      <RoomScreen
        announcement=""
        connection="online"
        error={null}
        muted={false}
        onCommand={() => Promise.resolve()}
        onReadySound={() => {}}
        onRefresh={() => Promise.resolve()}
        onTap={() => {}}
        onToggleMuted={() => {}}
        room={{ ...reveal, revealedNotes: [notes[0]!] }}
      />,
    );
    const singleBoard = document.querySelector('.note-board');
    expect(singleBoard?.className).toContain('notes-one');
    expect(singleBoard?.querySelectorAll(':scope > li')).toHaveLength(1);
  });
});

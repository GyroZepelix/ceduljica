// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoomProjection } from '../../src/domain/types.js';
import { Avatar } from '../../src/client/Avatar.js';
import { RoomScreen } from '../../src/client/RoomScreen.js';
import type { RoomCommand } from '../../src/client/types.js';

function room(overrides: Partial<RoomProjection> = {}): RoomProjection {
  return {
    roomId: 'room', roomCode: 'abcdefghijklmnopqrstuvwx', roundId: 'round-1', phase: 'writing', version: 2,
    self: { participantId: 'p0', nickname: 'Owner', isOwner: true, roundRole: 'active' },
    participants: Array.from({ length: 12 }, (_, index) => ({
      id: `p${index}`, avatarSlot: index, nickname: `Person ${index}`, connected: true,
      disconnectDeadline: null, isOwner: index === 0, roundRole: 'active', ready: false,
    })),
    ownNote: { body: 'private draft', ready: false }, canBegin: false, canReplay: false, ...overrides,
  };
}
function revealed(base = room()): RoomProjection {
  const next = { ...base, phase: 'reveal' as const, canReplay: true, revealedNotes: base.participants.map((person) => ({
    participantId: person.id, avatarSlot: person.avatarSlot, nickname: person.nickname, body: `Note ${person.id}`,
  })) };
  delete next.ownNote;
  return next;
}
function view(initial: RoomProjection, onCommand = vi.fn<(command: RoomCommand) => Promise<void>>().mockResolvedValue()) {
  const onRefresh = vi.fn<() => Promise<void>>().mockResolvedValue();
  const props = { announcement: '', error: null, muted: false, onToggleMuted: () => {}, onTap: () => {}, onReadySound: () => {}, onCommand, onRefresh };
  const result = render(<RoomScreen {...props} connection="online" room={initial} />);
  return { ...result, onCommand, onRefresh,
    update: (next: RoomProjection, connection: 'online' | 'offline' = 'online') => result.rerender(<RoomScreen {...props} connection={connection} room={next} />),
  };
}
const flight = () => document.querySelector('.note-flight');
let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
beforeEach(() => {
  vi.useFakeTimers();
  media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('matchMedia', () => media);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('round-aware, inert note flights', () => {
  it('does not animate restoration or snapshot churn; entry happens once per actual round', () => {
    const initial = room();
    const { update } = view(initial);
    expect(flight()).toBeNull();
    fireEvent.change(screen.getByLabelText('Your note'), { target: { value: 'local multiline\ndraft' } });
    update({ ...initial, version: 3 });
    expect(screen.getByLabelText<HTMLTextAreaElement>('Your note').value).toBe('local multiline\ndraft');
    expect(flight()).toBeNull();
    const second = room({ roundId: 'round-2', ownNote: { body: '', ready: false } });
    update(second); // Reconnect may have missed reveal: new round identity resets private editor.
    expect(flight()?.className).toContain('note-flight-in');
    expect(screen.getByLabelText<HTMLTextAreaElement>('Your note').value).toBe('');
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Write one private note' }));
    act(() => { vi.advanceTimersByTime(300); });
    update({ ...second, version: 9 });
    act(() => { vi.advanceTimersByTime(220); });
    expect(flight()).toBeNull(); // Snapshots do not restart lifetime.
    update({ ...second, version: 10, ownNote: { body: 'ready body', ready: true } });
    update({ ...second, version: 11, ownNote: { body: 'ready body', ready: false } });
    expect(flight()).toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText('Your note'));
  });

  it('reveals and focuses immediately, keeps only blank inert decoration, interrupts on replay/room change/unmount', () => {
    const timeout = vi.spyOn(window, 'setTimeout');
    const clear = vi.spyOn(window, 'clearTimeout');
    const { update, unmount } = view(room());
    update(revealed());
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Notes up!' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(document.body.textContent).not.toContain('private draft');
    expect(flight()?.getAttribute('aria-hidden')).toBe('true');
    expect(flight()?.textContent).toBe('');
    expect(flight()?.querySelector('textarea,button,input')).toBeNull();
    expect(flight()?.className).toContain('note-flight-out');
    expect(screen.getByRole('button', { name: 'Start a new round' }).hasAttribute('disabled')).toBe(false);
    update(room({ roundId: 'round-2', ownNote: { body: '', ready: false } }));
    expect(document.querySelector('.note-flight-out')).toBeNull();
    expect(document.querySelectorAll('textarea')).toHaveLength(1);
    expect(flight()?.className).toContain('note-flight-in');
    update(room({ roomId: 'different-room' }));
    expect(flight()).toBeNull();
    update(room({ roomId: 'different-room', roundId: 'new-round' }));
    const flightIndex = timeout.mock.calls.findLastIndex((call) => call[1] === 520);
    expect(flightIndex).toBeGreaterThanOrEqual(0);
    const flightTimer: unknown = timeout.mock.results[flightIndex]?.value;
    unmount();
    expect(clear).toHaveBeenCalledWith(flightTimer);
  });

  it('skips stale exits after reconnect, late join, and restoration into reveal', () => {
    const initial = room();
    const { update, unmount } = view(initial);
    update(initial, 'offline');
    update(initial, 'online'); // Socket opened, but no restored snapshot yet.
    update(revealed());
    expect(flight()).toBeNull();
    unmount();
    const waiting = room({ self: { ...initial.self, roundRole: 'waiting' } });
    delete waiting.ownNote;
    const late = view(waiting);
    late.update(revealed(waiting));
    expect(flight()).toBeNull();
    late.unmount();
    view(revealed());
    expect(flight()).toBeNull();
  });

  it('makes reduced motion instant without animation events, including preference changes mid-flight', () => {
    const timeout = vi.spyOn(window, 'setTimeout');
    const clear = vi.spyOn(window, 'clearTimeout');
    const { update } = view(room({ phase: 'lobby', roundId: null }));
    update(room());
    expect(flight()).not.toBeNull();
    const flightIndex = timeout.mock.calls.findLastIndex((call) => call[1] === 520);
    const flightTimer: unknown = timeout.mock.results[flightIndex]?.value;
    media.matches = true;
    act(() => { (media.addEventListener.mock.calls[0]?.[1] as () => void)(); });
    expect(flight()).toBeNull();
    update(revealed());
    expect(flight()).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Notes up!' }));
    expect(clear).toHaveBeenCalledWith(flightTimer);
  });

  it('keeps newer typing through delayed draft echoes and cancels pending debounce on a newer round', async () => {
    const initial = room();
    const { update, onCommand } = view(initial);
    fireEvent.change(screen.getByLabelText('Your note'), { target: { value: 'first edit' } });
    await act(async () => { vi.advanceTimersByTime(600); await Promise.resolve(); });
    fireEvent.change(screen.getByLabelText('Your note'), { target: { value: 'newer edit' } });
    await act(async () => { vi.advanceTimersByTime(600); await Promise.resolve(); });
    update({ ...initial, ownNote: { body: 'first edit', ready: false } });
    expect(screen.getByLabelText<HTMLTextAreaElement>('Your note').value).toBe('newer edit');
    update({ ...initial, ownNote: { body: 'newer edit', ready: false } });
    fireEvent.change(screen.getByLabelText('Your note'), { target: { value: 'do not submit in next round' } });
    update(room({ roundId: 'round-2', ownNote: { body: '', ready: false } }));
    await act(async () => { vi.advanceTimersByTime(1000); await Promise.resolve(); });
    expect(onCommand.mock.calls).toEqual([[{ type: 'save_draft', body: 'first edit' }], [{ type: 'save_draft', body: 'newer edit' }]]);
  });

  it('does not continue a pending Ready submission into a newer round after its editor unmounts', async () => {
    let resolveSave: (() => void) | undefined;
    const command = vi.fn<(command: RoomCommand) => Promise<void>>()
      .mockImplementationOnce(() => new Promise<void>((resolve) => { resolveSave = resolve; }));
    const { update } = view(room(), command);
    fireEvent.click(screen.getByRole('button', { name: /I'm ready/ }));
    update(room({ roundId: 'round-2', ownNote: { body: '', ready: false } }));
    await act(async () => { resolveSave?.(); await Promise.resolve(); });
    expect(command.mock.calls).toEqual([[{ type: 'save_draft', body: 'private draft' }]]);
    expect(screen.getByLabelText<HTMLTextAreaElement>('Your note').value).toBe('');
  });

  it('never reveals or flies out after a rejected Ready command, and cancels the draft debounce before Ready', async () => {
    let resolveSave: (() => void) | undefined;
    const command = vi.fn<(command: RoomCommand) => Promise<void>>()
      .mockImplementationOnce(() => new Promise<void>((resolve) => { resolveSave = resolve; }))
      .mockRejectedValueOnce(new Error('Ready rejected'));
    const { onRefresh } = view(room(), command);
    fireEvent.change(screen.getByLabelText('Your note'), { target: { value: 'changed\nprivate note' } });
    fireEvent.click(screen.getByRole('button', { name: /I'm ready/ }));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(command.mock.calls).toEqual([[{ type: 'save_draft', body: 'changed\nprivate note' }]]);
    await act(async () => { resolveSave?.(); await Promise.resolve(); });
    expect(command.mock.calls[1]).toEqual([{ type: 'ready' }]);
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(flight()).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Notes up!' })).toBeNull();
    expect(screen.getByLabelText<HTMLTextAreaElement>('Your note').value).toBe('changed\nprivate note');
  });
});

describe('note-first presentation and assigned characters', () => {
  it('has 12 distinct shape/color combinations and repeats assigned identity by author in stable order', () => {
    const avatars = render(<>{Array.from({ length: 12 }, (_, slot) => <Avatar key={slot} slot={slot} />)}</>);
    const variants = [...avatars.container.querySelectorAll('.avatar')].map((svg) => svg.innerHTML);
    expect(new Set(variants).size).toBe(12);
    avatars.unmount();
    const { update } = view(room());
    expect(screen.getByLabelText('Your note').closest('.composer-note')).not.toBeNull();
    expect(screen.getByLabelText('Your note').getAttribute('maxlength')).toBe('500');
    expect(document.querySelector('.phase-card')?.classList.contains('paper-card')).toBe(false);
    expect([...document.querySelectorAll('.people-card .avatar')].map((svg) => Number(svg.getAttribute('data-avatar-slot')))).toEqual(Array.from({ length: 12 }, (_, index) => index));
    update(room({ ownNote: { body: 'frozen\nbody', ready: true } }));
    expect(screen.getByText('frozen body').closest('.composer-note')).not.toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    update(revealed());
    expect(document.querySelector('.room-main')?.className).toContain('room-reveal');
    expect([...document.querySelectorAll('.note-board footer .avatar')].map((svg) => Number(svg.getAttribute('data-avatar-slot')))).toEqual(Array.from({ length: 12 }, (_, index) => index));
    expect(document.querySelector('.reveal-controls .owner-stamp')?.textContent).toBe('Owner');
  });
});

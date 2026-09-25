// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Mascot, NoteMark, PlazaBackdrop } from '../../src/client/Artwork.js';
import { Landing } from '../../src/client/Landing.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('shared artwork', () => {
  it('pauses the canvas when hidden, resumes when visible and removes its listener', () => {
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const remove = vi.spyOn(document, 'removeEventListener');
    const { container, unmount } = render(<PlazaBackdrop />);
    const backdrop = container.querySelector('.plaza-backdrop');
    expect(backdrop?.getAttribute('aria-hidden')).toBe('true');
    expect(backdrop?.getAttribute('data-paused')).toBe('false');
    hidden.mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    expect(backdrop?.getAttribute('data-paused')).toBe('true');
    hidden.mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    expect(backdrop?.getAttribute('data-paused')).toBe('false');
    unmount();
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('keeps header and mascot artwork decorative in both expressions', () => {
    const { container } = render(<><NoteMark /><Mascot /><Mascot calm /></>);
    expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(3);
    expect(container.querySelectorAll('.mascot path')).not.toHaveLength(0);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows five distinct authored images and preserves navigation/focus return', async () => {
    const user = userEvent.setup();
    render(<Landing muted={false} onEntered={() => {}} onTap={() => {}} onToggleMuted={() => {}} />);
    const opener = screen.getByRole('button', { name: 'How to use' });
    await user.click(opener);
    const dialog = screen.getByRole('dialog');
    const sources = new Set<string | null>();
    const descriptions = new Set<string | null>();
    for (let index = 0; index < 5; index += 1) {
      const image = within(dialog).getByRole('img');
      sources.add(image.getAttribute('src'));
      descriptions.add(image.getAttribute('alt'));
      expect(image.getAttribute('width')).toBe('1536');
      expect(image.getAttribute('height')).toBe('1024');
      expect(within(dialog).getByText(`Step ${String(index + 1)} of 5`)).toBeTruthy();
      if (index < 4) await user.click(within(dialog).getByRole('button', { name: 'Next' }));
    }
    expect(sources.size).toBe(5);
    expect(descriptions.size).toBe(5);
    await user.click(within(dialog).getByRole('button', { name: 'Back' }));
    expect(within(dialog).getByRole('heading', { name: 'Mark it ready' })).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));
    await user.click(within(dialog).getByRole('button', { name: "Let's make notes" }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});

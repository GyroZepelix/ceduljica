import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/client/styles.css', import.meta.url), 'utf8');

describe('responsive and motion contract', () => {
  it('defines phone, desktop, dense reveal, focus, and reduced-motion rules', () => {
    expect(css).toContain('@media (max-width: 719px)');
    expect(css).toContain('grid-template-columns: minmax(0, 1fr) 300px');
    expect(css).toContain('.note-board.notes-dense { grid-template-columns: repeat(4');
    expect(css).toContain('.mobile-note-progress { display: block; position: sticky');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('.note-motif { animation: none; }');
    expect(css).toContain('.plaza-backdrop[data-paused="true"] .note-motif { animation-play-state: paused; }');
    expect(css).toContain('outline: 3px solid var(--focus)');
    expect(css).toContain('min-width: 320px');
  });
});

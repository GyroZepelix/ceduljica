import type { ReactNode } from 'react';

// Four original Ceduljica silhouettes in three distinct palettes: 12 room-local identities.
const colors = ['#ffd53d', '#27b2f6', '#43d7a1', '#a98bff', '#ffb09e', '#9ddbd0',
  '#c8dc7a', '#f5a9cb', '#b8c8ff', '#f1be72', '#80d4ef', '#dfb9ed'];
const silhouettes = [
  'M15 10H39L51 22V49H15Z',
  'M52 30A20 20 0 1 1 12 30A20 20 0 1 1 52 30Z',
  'M32 9Q34 9 36 13L54 47Q55 50 51 50H13Q9 50 11 47L28 13Q30 9 32 9Z',
  'M22 10H42Q53 10 53 21V39Q53 50 42 50H22Q11 50 11 39V21Q11 10 22 10Z',
];

export function Avatar({ slot }: { slot: number }): ReactNode {
  const shape = slot % 4;
  return (
    <svg aria-hidden="true" className="avatar" data-avatar-slot={slot} viewBox="0 0 64 64" fill="none">
      <g stroke="#24154a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 33L6 39M48 33L58 28M25 49L22 57H17M40 49L43 57H48" />
        <path d={silhouettes[shape]} fill={colors[slot]} />
        {shape === 0 && <path d="M39 10V22H51" fill="#ffeb96" />}
        <path d={slot < 4 ? 'M27 38Q32 44 37 38' : slot < 8 ? 'M27 39Q32 35 37 39' : 'M27 38Q32 48 37 38Z'} />
      </g>
      <g fill="#24154a"><ellipse cx="25" cy="29" rx="2.5" ry="3.5" /><ellipse cx="39" cy="29" rx="2.5" ry="3.5" /></g>
      <g fill="#e47779"><ellipse cx="19" cy="36" rx="4" ry="2.5" /><ellipse cx="45" cy="36" rx="4" ry="2.5" /></g>
    </svg>
  );
}

import { useEffect, useState, type ReactNode } from 'react';

/** Original vector redraws of the local Ceduljica concept cast; never user content. */
export function Mascot({ calm = false }: { calm?: boolean }): ReactNode {
  return (
    <svg aria-hidden="true" className="mascot" viewBox="0 0 200 180" fill="none">
      <ellipse cx="102" cy="165" rx="62" ry="9" fill="#edd3a5" />
      <g stroke="#24154a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <path d={calm ? 'M45 99 Q23 104 28 122 M151 99 Q174 104 171 122' : 'M45 96 Q20 90 20 67 M151 96 Q176 87 177 64'} />
        <path d="M77 141 L73 158 L62 158 M124 141 L128 158 L139 158" />
        <path d="M48 24 L123 24 L153 54 L153 141 L45 141 Z" fill="#ffd53d" />
        <path d="M123 24 L123 54 L153 54" fill="#ffeb96" />
      </g>
      <g fill="#24154a">
        <ellipse cx="78" cy="80" rx="6" ry="10" />
        <ellipse cx="120" cy="80" rx="6" ry="10" />
        {calm ? <path d="M89 104 Q99 111 110 103" fill="none" stroke="#24154a" strokeWidth="5" strokeLinecap="round" /> : <path d="M82 101 Q99 97 117 101 Q113 126 99 124 Q85 123 82 101" />}
        <circle cx={calm ? 28 : 20} cy={calm ? 122 : 67} r="8" />
        <circle cx={calm ? 171 : 177} cy={calm ? 122 : 64} r="8" />
      </g>
      <g fill="#ff867e">
        <ellipse cx="62" cy="97" rx="10" ry="6" />
        <ellipse cx="136" cy="97" rx="10" ry="6" />
        {!calm && <path d="M90 116 Q99 107 110 114 Q105 123 99 122 Q94 122 90 116" />}
      </g>
      {!calm && <g stroke="#f0ad39" strokeWidth="5" strokeLinecap="round"><path d="M19 39 L12 29 M38 25 L36 12 M166 30 L175 20" /></g>}
    </svg>
  );
}

/** Small, deliberately simpler note-face lockup. Fold is part of the silhouette. */
export function NoteMark(): ReactNode {
  return (
    <svg aria-hidden="true" className="brand-mark" viewBox="0 0 40 40" fill="none">
      <path d="M5 3 H25 L37 15 V35 Q37 37 35 37 H5 Q3 37 3 35 V5 Q3 3 5 3Z" fill="#ffd53d" stroke="#24154a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M25 3 V15 H37" fill="#ffeb96" stroke="#24154a" strokeWidth="3" strokeLinejoin="round" />
      <g fill="#24154a"><ellipse cx="13" cy="23" rx="2" ry="3" /><ellipse cx="26" cy="23" rx="2" ry="3" /></g>
      <path d="M17 29 Q20 32 23 29" stroke="#24154a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PlazaBackdrop(): ReactNode {
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    const update = (): void => setHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return (
    <div aria-hidden="true" className="plaza-backdrop" data-paused={hidden}>
      <div className="note-motif" />
      <svg className="plaza-scenery scenery-left" viewBox="0 0 160 280" fill="none">
        <g stroke="#9b725e" strokeWidth="3" strokeLinejoin="round">
          <path d="M0 25 H104 V184 H0" fill="#f3c2a0" />
          <path d="M25 184 V105 A27 27 0 0 1 54 78 A27 27 0 0 1 82 105 V184" fill="#ffe9b9" />
          <path d="M0 25 L106 25 L114 40 H0 M0 184 H115 V201 H0 M0 201 H132 V219 H0" fill="#e6aa8d" />
        </g>
        <g stroke="#56876c" strokeWidth="3" strokeLinecap="round">
          <path d="M123 233 Q77 172 102 146 Q131 151 123 233 M124 233 Q115 170 145 162 Q163 185 124 233" fill="#9bc498" />
          <path d="M122 231 L110 173 M125 227 L142 185" />
        </g>
        <path d="M97 229 H151 L141 266 H106Z" fill="#e6aa8d" stroke="#9b725e" strokeWidth="3" />
      </svg>
      <svg className="plaza-scenery scenery-right" viewBox="0 0 160 280" fill="none">
        <g stroke="#56876c" strokeWidth="3" strokeLinecap="round">
          <path d="M80 220 V118 M80 170 L52 147 M80 150 L104 130" />
          <path d="M52 149 C10 150 16 109 36 111 C9 66 57 56 68 76 C62 28 113 31 111 70 C153 49 158 102 126 113 C151 153 109 169 80 143 C73 156 58 157 52 149Z" fill="#b4cea0" />
          <path d="M80 217 V110 M80 149 L54 129 M80 137 L105 107" />
        </g>
        <path d="M47 212 H114 L102 266 H57Z" fill="#f3c2a0" stroke="#9b725e" strokeWidth="3" />
        <path d="M32 213 H128 V227 H32Z" fill="#e6aa8d" stroke="#9b725e" strokeWidth="3" />
      </svg>
    </div>
  );
}

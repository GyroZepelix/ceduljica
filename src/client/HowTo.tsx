import { useState, type ReactNode } from 'react';
import { Modal } from './Modal.js';
import createArt from './assets/howto-create.png';
import inviteArt from './assets/howto-invite.png';
import writeArt from './assets/howto-write.png';
import readyArt from './assets/howto-ready.png';
import revealArt from './assets/howto-reveal.png';

const SCENES = [
  [createArt, 'A sticky-note friend sets up a blank note in a new meeting space.'],
  [inviteArt, 'A sticky-note friend invites geometric friends to gather.'],
  [writeArt, 'A sticky-note friend uses a pencil on one private note.'],
  [readyArt, 'A sticky-note friend signals ready with a check beside a finished note.'],
  [revealArt, 'Four friends celebrate their notes revealed together on a shared board.'],
] as const;

const STEPS = [
  ['Create a room', 'Choose a display name, then share the private invite link with your group.'],
  ['Invite your people', 'Rooms hold up to 12 people. Two connected people are needed to begin.'],
  ['Write one note', 'Your note stays private while everyone writes. Only your draft comes back to this browser.'],
  ['Mark it ready', 'Ready freezes your note. You can still edit until the final Ready reveals the board.'],
  ['Reveal together', 'When every eligible note is ready, the server reveals all named notes at once.'],
] as const;

interface HowToProps {
  onClose: () => void;
  onTap: () => void;
}

export function HowTo({ onClose, onTap }: HowToProps): ReactNode {
  const [step, setStep] = useState(0);
  const content = STEPS[step];
  const scene = SCENES[step];
  if (!content || !scene) return null;
  return (
    <Modal title="How to use Ceduljica" onClose={onClose}>
      <p className="eyebrow">Step {step + 1} of {STEPS.length}</p>
      <div className="howto-illustration">
        <img alt={scene[1]} src={scene[0]} width={1536} height={1024} />
      </div>
      <h3>{content[0]}</h3>
      <p>{content[1]}</p>
      <div className="modal-actions split-actions">
        <button
          className="button secondary"
          disabled={step === 0}
          onClick={() => { onTap(); setStep((value) => value - 1); }}
          type="button"
        >
          Back
        </button>
        {step === STEPS.length - 1 ? (
          <button className="button primary" onClick={() => { onTap(); onClose(); }} type="button">
            Let's make notes
          </button>
        ) : (
          <button className="button primary" onClick={() => { onTap(); setStep((value) => value + 1); }} type="button">
            Next
          </button>
        )}
      </div>
    </Modal>
  );
}

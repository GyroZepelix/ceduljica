import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  initialFocus?: 'first' | 'last' | 'marked';
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function Modal({ title, onClose, children, initialFocus = 'first' }: ModalProps): ReactNode {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const returnTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const appRoot = document.getElementById('root');
    const wasInert = appRoot?.hasAttribute('inert') ?? false;
    const priorHidden = appRoot?.getAttribute('aria-hidden');
    appRoot?.setAttribute('inert', '');
    appRoot?.setAttribute('aria-hidden', 'true');
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    const target = initialFocus === 'marked'
      ? dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')
      : initialFocus === 'last'
        ? focusable?.item(focusable.length - 1)
        : focusable?.item(0);
    target?.focus();
    return () => {
      if (!wasInert) appRoot?.removeAttribute('inert');
      if (priorHidden === null || priorHidden === undefined) appRoot?.removeAttribute('aria-hidden');
      else appRoot?.setAttribute('aria-hidden', priorHidden);
      returnTarget?.focus();
    };
  }, [initialFocus]);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape' && onClose) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!focusable?.length) return;
    const first = focusable.item(0);
    const last = focusable.item(focusable.length - 1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="modal"
        onKeyDown={onKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <div className="modal-heading">
          <h2 id={titleId}>{title}</h2>
          {onClose ? (
            <button aria-label={`Close ${title}`} className="icon-button" onClick={onClose} type="button">
              ×
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

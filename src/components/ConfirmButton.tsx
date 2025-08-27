// src/components/ConfirmButton.tsx
"use client";

import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Text für den Bestätigungsdialog (window.confirm). Wenn leer, kein Dialog. */
  confirm?: string;
  /** Server Action (Next.js) – wird über formAction am Button gesetzt. */
  formAction?: (formData: FormData) => void | Promise<void>;
};

/**
 * ConfirmButton
 * - zeigt optional einen window.confirm()-Dialog
 * - ruft KEINE Server Action selbst auf, sondern lässt den Submit durch,
 *   damit Next die `formAction` korrekt verarbeitet.
 * - reicht alle Button-Props durch (className, disabled, aria-*, onClick, type, ...)
 */
const ConfirmButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ confirm, formAction, type = "submit", onClick, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        formAction={formAction}
        onClick={(e) => {
          // eigener Confirm-Check
          if (confirm && !window.confirm(confirm)) {
            e.preventDefault();
            return;
          }
          // optional: eigenes onClick des Aufrufers (z. B. Analytics)
          if (onClick) onClick(e);
        }}
        {...rest}
      />
    );
  }
);

ConfirmButton.displayName = "ConfirmButton";
export default ConfirmButton;

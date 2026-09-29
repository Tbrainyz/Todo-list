"use client";
import { useEffect, useRef } from "react";

export function ConfirmDialog({
  open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", danger, onConfirm, onCancel,
}: {
  open: boolean; title: string; description?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <p id="confirm-title" className="modal-title">{title}</p>
        {description && <p className="modal-desc">{description}</p>}
        <div className="modal-actions">
          <button ref={cancelRef} type="button" className="btn-small" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`btn-small ${danger ? "danger" : "primary"}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

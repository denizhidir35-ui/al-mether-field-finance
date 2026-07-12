"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { WorkspaceBackdrop } from "./WorkspaceBackdrop";
import { WorkspacePanel, type WorkspaceOrigin } from "./WorkspacePanel";

type FocusLayerProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  origin?: WorkspaceOrigin | null;
  originPreview?: ReactNode;
};

const FOCUSABLE = "button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex='-1'])";

export function FocusLayer({ open, onClose, label, children, origin, originPreview }: FocusLayerProps) {
  const [present, setPresent] = useState(open);
  const [active, setActive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      setPresent(true);
      const frame = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(frame);
    }
    setActive(false);
    const timeout = window.setTimeout(() => setPresent(false), 260);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    document.body.classList.toggle("focus-layer-open", open);
    return () => document.body.classList.remove("focus-layer-open");
  }, [open]);

  useEffect(() => {
    if (!present) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = requestAnimationFrame(() => panelRef.current?.focus());

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) { event.preventDefault(); panelRef.current.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [present]);

  if (!present || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-4 max-md:p-0"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onPointerDown={event => { touchStartY.current = window.innerWidth < 768 && event.clientY < 140 ? event.clientY : null; }}
      onPointerUp={event => {
        if (touchStartY.current !== null && window.innerWidth < 768 && event.clientY - touchStartY.current > 90) onClose();
        touchStartY.current = null;
      }}
    >
      <WorkspaceBackdrop active={active} onClose={onClose} />
      {origin && originPreview ? (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed z-20 overflow-hidden rounded-xl border border-blue-400/25 bg-[#0b1427]/98 shadow-[0_12px_40px_rgba(37,99,235,.24)] transition-opacity duration-100 ${active ? "opacity-0" : "opacity-100"}`}
          style={{ top: origin.top, left: origin.left, width: origin.width, height: origin.height }}
        >
          {originPreview}
        </div>
      ) : null}
      <WorkspacePanel ref={panelRef} active={active} origin={origin}>{children}</WorkspacePanel>
    </div>,
    document.body,
  );
}

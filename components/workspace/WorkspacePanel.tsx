"use client";

import { forwardRef, type HTMLAttributes } from "react";

type WorkspacePanelProps = HTMLAttributes<HTMLDivElement> & { active: boolean };

export const WorkspacePanel = forwardRef<HTMLDivElement, WorkspacePanelProps>(function WorkspacePanel(
  { active, className = "", children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      className={`relative z-10 flex h-[min(780px,calc(100dvh-48px))] w-[min(1080px,calc(100vw-32px))] flex-col overflow-hidden rounded-[24px] border border-white/[0.1] bg-[linear-gradient(145deg,rgba(13,22,40,.98),rgba(5,11,24,.98))] shadow-[0_40px_120px_rgba(0,0,0,.62)] outline-none transition-[transform,opacity] duration-200 ease-out max-md:h-dvh max-md:w-screen max-md:rounded-none max-md:border-0 ${active ? "scale-100 opacity-100" : "scale-95 opacity-0"} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

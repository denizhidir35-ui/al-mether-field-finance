"use client";

import { forwardRef, useLayoutEffect, useRef, useState, type HTMLAttributes } from "react";

export type WorkspaceOrigin = { top: number; left: number; width: number; height: number };

type WorkspacePanelProps = HTMLAttributes<HTMLDivElement> & { active: boolean; origin?: WorkspaceOrigin | null };

export const WorkspacePanel = forwardRef<HTMLDivElement, WorkspacePanelProps>(function WorkspacePanel(
  { active, origin, className = "", children, ...props },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const [originTransform, setOriginTransform] = useState<string>("scale(.95)");

  useLayoutEffect(() => {
    const panel = localRef.current;
    if (!panel || !origin) { setOriginTransform("scale(.95)"); return; }
    const target = panel.getBoundingClientRect();
    const scaleX = Math.max(0.04, origin.width / target.width);
    const scaleY = Math.max(0.04, origin.height / target.height);
    const translateX = origin.left + origin.width / 2 - (target.left + target.width / 2);
    const translateY = origin.top + origin.height / 2 - (target.top + target.height / 2);
    setOriginTransform(`translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`);
  }, [origin]);

  return (
    <div
      ref={node => {
        localRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      tabIndex={-1}
      style={{ transform: active ? "translate3d(0,0,0) scale(1)" : originTransform, opacity: active ? 1 : origin ? 0.82 : 0 }}
      className={`relative z-10 flex h-[min(780px,calc(100dvh-48px))] w-[min(1080px,calc(100vw-32px))] flex-col overflow-hidden rounded-[24px] border border-white/[0.1] bg-[linear-gradient(145deg,rgba(13,22,40,.98),rgba(5,11,24,.98))] shadow-[0_40px_120px_rgba(0,0,0,.62)] outline-none transition-[transform,opacity] duration-[250ms] ease-[cubic-bezier(.22,1,.36,1)] will-change-transform max-md:h-dvh max-md:w-screen max-md:rounded-none max-md:border-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

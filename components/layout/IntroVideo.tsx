"use client";

import { useEffect, useRef } from "react";

type IntroVideoProps = {
  onFinish: () => void;
};

export function IntroVideo({ onFinish }: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(onFinish, 9000);
    void videoRef.current?.play().catch(() => onFinish());

    return () => window.clearTimeout(timeout);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#02050d]">
      <video
        ref={videoRef}
        src="/intro.mp4"
        muted
        playsInline
        autoPlay
        onEnded={onFinish}
        className="h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#02050d]/85 via-transparent to-[#02050d]/25" />

      <button
        type="button"
        onClick={onFinish}
        className="absolute bottom-6 right-6 rounded-full border border-white/15 bg-black/40 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-black/60"
      >
        Geç
      </button>
    </div>
  );
}
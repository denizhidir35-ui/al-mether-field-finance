"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, Camera, ImagePlus, ScanLine, X } from "lucide-react";
import type { FieldPersonnelCode } from "../../domain/identifiers";
import { decodePersonnelQrPixels, scanPersonnelQrImage } from "../../services/qr.service";

export function PersonnelQrScanner({ onDetected, onBack }: { onDetected: (code: FieldPersonnelCode) => string; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const acceptCode = useCallback((code: FieldPersonnelCode) => {
    try {
      setError(null);
      setMessage(onDetected(code));
      stopCamera();
    } catch (cause) {
      setMessage(null);
      setError(cause instanceof Error ? cause.message : "Personel QR doğrulanamadı.");
    }
  }, [onDetected, stopCamera]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
      const maxWidth = 960;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        try {
          const code = decodePersonnelQrPixels(image.data, canvas.width, canvas.height);
          if (code) { acceptCode(code); return; }
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Geçersiz personel QR kodu.");
        }
      }
    }
    frameRef.current = requestAnimationFrame(scanFrame);
  }, [acceptCode]);

  async function startCamera() {
    setError(null);
    setMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Bu tarayıcı canlı kamera erişimini desteklemiyor. QR fotoğrafı seçeneğini kullanın.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (!videoRef.current) throw new Error("Kamera ekranı başlatılamadı.");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch (cause) {
      stopCamera();
      const name = cause instanceof DOMException ? cause.name : "";
      setError(name === "NotAllowedError" ? "Kamera izni reddedildi. Tarayıcı ayarlarından kamera iznini açın." : cause instanceof Error ? cause.message : "Kamera açılamadı.");
    }
  }

  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setMessage(null);
    try { acceptCode(await scanPersonnelQrImage(file)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "QR fotoğrafı okunamadı."); }
  }

  return <section className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-4">
    <button type="button" onClick={() => { stopCamera(); onBack(); }} className="flex h-9 w-fit items-center gap-1.5 text-[9px] font-bold text-slate-500"><ArrowLeft size={13} /> Ana Konsol</button>
    <div className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-blue-400/70">Personel QR</div>
    <h2 className="mt-2 text-2xl font-black text-white">Personel Mesaisi</h2>
    <p className="mt-2 text-[10px] leading-5 text-slate-500">Telefonda kamerayla canlı tara veya PC’den QR fotoğrafını seç.</p>
    {cameraOpen ? <div className="relative mt-4 overflow-hidden rounded-2xl border border-blue-400/20 bg-black"><video ref={videoRef} muted playsInline className="aspect-[4/3] w-full object-cover"/><div className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-blue-300/80 shadow-[0_0_0_999px_rgba(0,0,0,.28)]"/><button type="button" onClick={stopCamera} aria-label="Kamerayı kapat" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl bg-black/70 text-white"><X size={16}/></button></div> : null}
    <canvas ref={canvasRef} className="hidden"/>
    {message ? <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-500/10 p-3 text-[10px] text-emerald-200">{message}</div> : null}
    {error ? <div role="alert" className="mt-3 rounded-xl border border-rose-400/15 bg-rose-500/10 p-3 text-[10px] text-rose-200">{error}</div> : null}
    <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
      <button type="button" onClick={() => void startCamera()} disabled={cameraOpen} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[11px] font-black text-white disabled:opacity-45"><Camera size={17}/> Kamerayla Tara</button>
      <label className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-blue-400/20 bg-blue-500/10 text-[11px] font-black text-blue-200"><ImagePlus size={17}/> QR Fotoğrafı Seç<input type="file" accept="image/*" onChange={selectImage} className="sr-only"/></label>
    </div>
    <div className="mt-3 flex items-center justify-center gap-1.5 text-[8px] text-slate-600"><ScanLine size={12}/> Yalnız atanmış personel QR kodu kabul edilir.</div>
  </section>;
}

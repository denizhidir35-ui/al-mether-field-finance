"use client";

type WorkspaceBackdropProps = {
  active: boolean;
  onClose: () => void;
};

export function WorkspaceBackdrop({ active, onClose }: WorkspaceBackdropProps) {
  return (
    <button
      type="button"
      aria-label="Çalışma alanını kapat"
      onClick={onClose}
      className={`absolute inset-0 cursor-default bg-[#020611]/72 backdrop-blur-[8px] transition-opacity duration-200 ease-out ${active ? "opacity-100" : "opacity-0"}`}
    />
  );
}

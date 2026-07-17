"use client";
import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileCheck2, FolderArchive, ShieldCheck, UserRound } from "lucide-react";
import type { AppUser } from "@/types/auth";
import type { EmployeePortalSnapshot } from "../repositories/employee-portal.repository";
import { HttpEmployeePortalRepository } from "../repositories/http-employee-portal.repository";

export function EmployeePortal({ user }: { user: AppUser }) {
  const repository = useMemo(() => new HttpEmployeePortalRepository(), []);
  const [snapshot, setSnapshot] = useState<EmployeePortalSnapshot | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void repository.loadSelf().then(setSnapshot).catch(reason => setError(reason instanceof Error ? reason.message : "Portal yüklenemedi.")); }, [repository]);
  async function accessDocument(documentId: string, versionId: string, mode: "view" | "download") {
    try {
      const access = await repository.accessDocument(documentId, versionId, mode);
      window.open(access.url, mode === "view" ? "_blank" : "_self", "noopener,noreferrer");
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Belge açılamadı.");
    }
  }
  return <div className="grid gap-3"><header className="mether-surface rounded-[24px] p-5"><div className="text-[9px] font-black uppercase tracking-[.18em] text-blue-400">Employee Portal</div><h1 className="mt-2 text-2xl font-black text-white">{snapshot?.employee.displayName ?? user.name}</h1><div className="mt-1 text-[10px] text-blue-300">{snapshot?.employee.employeeCode ?? user.platformUserCode} · {snapshot?.employee.jobTitle ?? user.title}</div></header>{error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] text-rose-200">{error}</div> : null}<div className="grid gap-3 sm:grid-cols-3">{[["Profilim", UserRound], ["Personel Dosyam", FolderArchive], ["Belgelerim", FileCheck2]].map(([label, Icon]) => <article key={label as string} className="mether-surface rounded-[22px] p-5"><Icon size={20} className="text-blue-400"/><div className="mt-4 text-sm font-black text-white">{label as string}</div></article>)}</div><section className="mether-surface rounded-[24px] p-5"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-blue-300"><ShieldCheck size={15}/> Bana Gönderilen Belgeler</div><div className="mt-4 space-y-2">{snapshot?.documents.map(document => <div key={document.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[.06] p-4"><div><div className="text-[11px] font-black text-white">{document.title}</div><div className="mt-1 text-[8px] text-blue-300">{document.approvalLevel} · {document.status}</div></div>{document.hasFile ? <div className="flex gap-2"><button type="button" onClick={() => void accessDocument(document.documentId, document.versionId, "view")} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.08] text-blue-300" aria-label="Belgeyi görüntüle"><Eye size={14}/></button><button type="button" onClick={() => void accessDocument(document.documentId, document.versionId, "download")} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.08] text-blue-300" aria-label="Belgeyi indir"><Download size={14}/></button></div> : null}</div>)}{snapshot && snapshot.documents.length === 0 ? <div className="rounded-2xl border border-dashed border-white/[.08] p-7 text-center text-[9px] text-slate-600">Henüz gönderilmiş belge yok.</div> : null}</div></section></div>;
}

"use client";

import { useState, type FormEvent } from "react";
import { Bell, Boxes, Building2, CalendarDays, FileCheck2, FileText, FolderArchive, LayoutDashboard, Network, RefreshCw, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import type { AppUser } from "@/types/auth";
import type { HrSection } from "../domain/hr-foundation";
import { useHrFoundation } from "../hooks/useHrFoundation";
import { WorkforceModule } from "./WorkforceModule";

const SECTIONS: { id: HrSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "employees", label: "Çalışanlar", icon: UsersRound },
  { id: "organizations", label: "Organizasyonlar", icon: Building2 }, { id: "departments", label: "Departmanlar", icon: Network },
  { id: "teams", label: "Takımlar", icon: ShieldCheck }, { id: "leave", label: "İzin Yönetimi", icon: CalendarDays },
  { id: "payroll", label: "Bordro", icon: WalletCards }, { id: "documents", label: "Belgeler", icon: FileText },
  { id: "personnel-file", label: "Personel Dosyası", icon: FolderArchive }, { id: "assets", label: "Zimmetler", icon: Boxes },
  { id: "notifications", label: "Bildirimler", icon: Bell },
];
const inputClass = "h-11 w-full rounded-xl border border-white/[.07] bg-black/20 px-3 text-[11px] text-white outline-none focus:border-blue-400/35";

export function HrFoundationModule({ user }: { user: AppUser }) {
  const [section, setSection] = useState<HrSection>("dashboard");
  const { snapshot, loading, error, refresh, execute } = useHrFoundation();
  const selected = SECTIONS.find(item => item.id === section) ?? SECTIONS[0];
  const canManage = ["CEO", "PARTNER", "HR", "PLATFORM_ADMIN"].includes(user.role);
  return <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
    <aside className="mether-surface mether-scroll flex min-h-0 gap-1 overflow-x-auto rounded-[24px] p-2 lg:flex-col lg:overflow-y-auto">
      <div className="hidden px-3 pb-3 pt-2 lg:block"><div className="text-[9px] font-black uppercase tracking-[.2em] text-blue-400">HR Foundation</div><div className="mt-1 text-sm font-black text-white">İnsan Kaynakları</div><div className="mt-1 text-[9px] text-slate-600">{user.companyId} · {user.role}</div></div>
      {SECTIONS.map(item => { const Icon = item.icon; const active = item.id === section; return <button key={item.id} onClick={() => setSection(item.id)} className={`flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-left text-[10px] font-bold transition ${active ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-white/[.04] hover:text-slate-200"}`}><Icon size={15}/>{item.label}</button>; })}
    </aside>
    <section className="grid min-h-0 grid-rows-[auto_1fr] gap-3">
      <header className="mether-surface flex items-center justify-between rounded-[24px] px-5 py-3"><div><div className="text-[9px] font-black uppercase tracking-[.18em] text-blue-400">HR · {selected.label}</div><h1 className="mt-1 text-xl font-black text-white">{selected.label}</h1></div><button onClick={() => void refresh()} disabled={loading} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.07] text-slate-500 hover:text-blue-300"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/></button></header>
      <div className="mether-scroll min-h-0 overflow-y-auto pr-1">{error ? <div className="mb-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] text-rose-200">{error}</div> : null}
        {section === "dashboard" ? <Dashboard snapshot={snapshot}/> : null}{section === "employees" ? canManage ? <WorkforceModule embedded/> : <FoundationList title="Çalışanlar" count={snapshot?.employees.length ?? 0} description="Yalnız yetki kapsamınızdaki çalışanlar gösterilir."/> : null}
        {section === "organizations" ? <Hierarchy canManage={canManage} mode="organization" snapshot={snapshot} execute={execute}/> : null}
        {section === "departments" ? <Hierarchy canManage={canManage} mode="department" snapshot={snapshot} execute={execute}/> : null}
        {section === "teams" ? <Hierarchy canManage={canManage} mode="team" snapshot={snapshot} execute={execute}/> : null}
        {section === "documents" ? <Documents canManage={canManage} snapshot={snapshot} execute={execute}/> : null}
        {section === "personnel-file" ? <PersonnelFiles employees={snapshot?.employees ?? []}/> : null}
        {section === "leave" ? <FoundationList title="İzin Yönetimi" count={snapshot?.counts.leave ?? 0} description="İzin talepleri, yönetici onayı ve izin geçmişi şirket kapsamında yönetilir."/> : null}
        {section === "payroll" ? <FoundationList title="Bordro" count={snapshot?.counts.payroll ?? 0} description="Bordrolar personelin dijital dosyasına dönem ve versiyon bilgisiyle bağlanır."/> : null}
        {section === "assets" ? <FoundationList title="Zimmetler" count={snapshot?.counts.assets ?? 0} description="Fiziksel varlık kendi modülünde kalır; HR yalnızca çalışan atamasını yönetir."/> : null}
        {section === "notifications" ? <FoundationList title="Bildirimler" count={snapshot?.counts.notifications ?? 0} description="Belge, izin ve personel yaşam döngüsü bildirimleri tek akışta görünür."/> : null}
      </div>
    </section>
  </div>;
}

type Snapshot = ReturnType<typeof useHrFoundation>["snapshot"];
type Execute = ReturnType<typeof useHrFoundation>["execute"];

function Dashboard({ snapshot }: { snapshot: Snapshot }) {
  const cards = [["Çalışan", snapshot?.employees.length ?? 0, UsersRound], ["Organizasyon", snapshot?.organizations.length ?? 0, Building2], ["Departman", snapshot?.departments.length ?? 0, Network], ["Takım", snapshot?.teams.length ?? 0, ShieldCheck], ["Aktivasyon Bekliyor", snapshot?.counts.pendingActivation ?? 0, Bell], ["Dijital Belge", snapshot?.documents.length ?? 0, FileCheck2]] as const;
  return <div className="grid gap-3"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, Icon]) => <article key={label} className="mether-surface rounded-[22px] p-4"><div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[.14em] text-slate-500">{label}<Icon size={16} className="text-blue-400"/></div><div className="mt-4 text-3xl font-black text-white">{value}</div></article>)}</div><article className="mether-surface rounded-[24px] p-5"><div className="text-[9px] font-black uppercase tracking-[.18em] text-blue-400">Company → Organization → Department → Team → Employee</div><div className="mt-4 grid gap-2 lg:grid-cols-2">{snapshot?.organizations.map(org => <div key={org.id} className="rounded-2xl border border-white/[.06] bg-black/10 p-4"><div className="text-sm font-black text-white">{org.name}</div><div className="mt-1 text-[9px] text-blue-300">{org.code}</div><div className="mt-3 text-[9px] text-slate-500">{snapshot.departments.filter(dep => dep.organizationId === org.id).length} departman</div></div>)}{!snapshot?.organizations.length ? <Empty text="İlk organizasyonu Organizasyonlar bölümünden oluştur."/> : null}</div></article></div>;
}

function Hierarchy({ mode, snapshot, execute, canManage }: { mode: "organization" | "department" | "team"; snapshot: Snapshot; execute: Execute; canManage: boolean }) {
  const [name, setName] = useState(""); const [parentId, setParentId] = useState("");
  const items = mode === "organization" ? snapshot?.organizations ?? [] : mode === "department" ? snapshot?.departments ?? [] : snapshot?.teams ?? [];
  const title = mode === "organization" ? "Organizasyon" : mode === "department" ? "Departman" : "Takım";
  const parents = mode === "department" ? snapshot?.organizations ?? [] : mode === "team" ? snapshot?.departments ?? [] : [];
  async function submit(event: FormEvent) { event.preventDefault(); if (mode === "organization") await execute({ action: "CREATE_ORGANIZATION", name }); else if (mode === "department") await execute({ action: "CREATE_DEPARTMENT", name, organizationId: parentId }); else await execute({ action: "CREATE_TEAM", name, departmentId: parentId }); setName(""); }
  return <div className={`grid gap-3 ${canManage ? "lg:grid-cols-[320px_1fr]" : ""}`}>{canManage ? <form onSubmit={submit} className="mether-surface rounded-[24px] p-4"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Yeni {title}</div><div className="mt-4 space-y-3">{mode !== "organization" ? <select required value={parentId} onChange={event => setParentId(event.target.value)} className={inputClass}><option value="">Üst birim seç</option>{parents.map(parent => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select> : null}<input required value={name} onChange={event => setName(event.target.value)} className={inputClass} placeholder={`${title} adı`}/><button className="h-11 w-full rounded-xl bg-blue-600 text-[10px] font-black text-white">Oluştur</button></div></form> : null}<div className="mether-surface rounded-[24px] p-4"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">{title}lar · {items.length}</div><div className="mt-4 grid gap-2 sm:grid-cols-2">{items.map(item => <div key={item.id} className="rounded-2xl border border-white/[.06] bg-black/10 p-4"><div className="text-[11px] font-black text-white">{item.name}</div><div className="mt-1 text-[9px] text-blue-300">{item.code}</div><div className="mt-3 text-[8px] text-slate-600">{item.status}</div></div>)}{items.length === 0 ? <Empty text={`Henüz ${title.toLocaleLowerCase("tr-TR")} yok.`}/> : null}</div></div></div>;
}

function Documents({ snapshot, execute, canManage }: { snapshot: Snapshot; execute: Execute; canManage: boolean }) {
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); await execute({ action: "CREATE_DOCUMENT", title, content }); setTitle(""); setContent(""); }
  return <div className={`grid gap-3 ${canManage ? "lg:grid-cols-[360px_1fr]" : ""}`}>{canManage ? <form onSubmit={submit} className="mether-surface rounded-[24px] p-4"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Dijital Belge Oluştur</div><div className="mt-4 space-y-3"><input required value={title} onChange={event => setTitle(event.target.value)} className={inputClass} placeholder="Belge başlığı"/><textarea required value={content} onChange={event => setContent(event.target.value)} className={`${inputClass} h-32 py-3`} placeholder="Belge içeriği"/><button className="h-11 w-full rounded-xl bg-blue-600 text-[10px] font-black text-white">Taslak Oluştur</button></div></form> : null}<div className="mether-surface rounded-[24px] p-4"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Belgeler · {snapshot?.documents.length ?? 0}</div><div className="mt-4 space-y-2">{snapshot?.documents.map(doc => <div key={doc.id} className="rounded-2xl border border-white/[.06] bg-black/10 p-4"><div className="text-[11px] font-black text-white">{doc.title}</div><div className="mt-1 text-[9px] text-blue-300">{doc.documentCode} · v{doc.version}</div><div className="mt-3 text-[8px] text-slate-600">{doc.recipientCount} alıcı · gönder → oku → onayla → audit</div></div>)}{!snapshot?.documents.length ? <Empty text="Henüz dijital belge yok."/> : null}</div></div></div>;
}

function PersonnelFiles({ employees }: { employees: NonNullable<Snapshot>["employees"] }) { const categories = ["Kimlik", "Belgeler", "Bordrolar", "Sözleşmeler", "Sertifikalar", "İzin Geçmişi", "Zimmet"]; return <div className="grid gap-3 lg:grid-cols-[300px_1fr]"><div className="mether-surface rounded-[24px] p-4"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Çalışanlar · {employees.length}</div><div className="mt-4 space-y-2">{employees.map(employee => <div key={employee.id} className="rounded-xl border border-white/[.06] p-3"><div className="text-[10px] font-black text-white">{employee.displayName}</div><div className="mt-1 text-[8px] text-blue-300">{employee.employeeCode}</div></div>)}</div></div><div className="mether-surface rounded-[24px] p-4"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Dijital Personel Dosyası</div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{categories.map(category => <div key={category} className="rounded-2xl border border-white/[.06] bg-black/10 p-4"><FolderArchive size={17} className="text-blue-400"/><div className="mt-3 text-[10px] font-black text-white">{category}</div></div>)}</div></div></div>; }
function FoundationList({ title, count, description }: { title: string; count: number; description: string }) { return <article className="mether-surface rounded-[24px] p-6"><div className="text-[9px] font-black uppercase tracking-[.18em] text-blue-400">HR Foundation</div><div className="mt-3 flex items-end gap-3"><h2 className="text-2xl font-black text-white">{title}</h2><span className="text-2xl font-black text-blue-300">{count}</span></div><p className="mt-4 max-w-2xl text-[11px] leading-6 text-slate-500">{description}</p><div className="mt-6 rounded-2xl border border-dashed border-white/[.08] p-8 text-center text-[10px] text-slate-600">Temel veri modeli, repository ve RLS hazır. Kayıtlar oluştukça bu alan otomatik dolacak.</div></article>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-white/[.08] p-7 text-center text-[9px] text-slate-600">{text}</div>; }

"use client";

import { useState, type FormEvent } from "react";
import { Bell, Boxes, Building2, CalendarDays, CreditCard, FileCheck2, FileDown, FileText, Fingerprint, FolderArchive, IdCard, LayoutDashboard, Network, Nfc, QrCode, RefreshCw, ScanLine, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import type { AppUser } from "@/types/auth";
import type { HrSection } from "../domain/hr-foundation";
import { useHrFoundation } from "../hooks/useHrFoundation";
import { OrganizationCenter } from "./OrganizationCenter";
import { WorkforceModule } from "./WorkforceModule";

const SECTIONS: { id: HrSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "employees", label: "Çalışanlar", icon: UsersRound },
  { id: "organizations", label: "Organizasyon Yapısı", icon: Building2 }, { id: "departments", label: "Departmanlar", icon: Network },
  { id: "teams", label: "Takımlar", icon: ShieldCheck }, { id: "leave", label: "İzin Yönetimi", icon: CalendarDays },
  { id: "payroll", label: "Bordro", icon: WalletCards }, { id: "documents", label: "Belgeler", icon: FileText },
  { id: "personnel-file", label: "Personel Dosyası", icon: FolderArchive }, { id: "assets", label: "Zimmetler", icon: Boxes },
  { id: "notifications", label: "Bildirimler", icon: Bell }, { id: "identity-settings", label: "Personel Kimliği", icon: IdCard },
];
const inputClass = "h-12 w-full rounded-2xl border border-white/[.07] bg-black/20 px-4 text-[12px] text-white outline-none transition focus:border-blue-400/35";

export function HrFoundationModule({ user }: { user: AppUser }) {
  const [section, setSection] = useState<HrSection>("dashboard");
  const { snapshot, loading, error, refresh, execute } = useHrFoundation();
  const selected = SECTIONS.find(item => item.id === section) ?? SECTIONS[0];
  const canManage = ["CEO", "PARTNER", "HR", "PLATFORM_ADMIN"].includes(user.role);
  return <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[228px_minmax(0,1fr)]">
    <aside className="mether-surface mether-scroll grid min-h-0 grid-cols-2 gap-1.5 rounded-[24px] p-3 sm:grid-cols-3 lg:flex lg:flex-col lg:overflow-y-auto">
      <div className="col-span-full hidden px-3 pb-4 pt-2 lg:block"><div className="text-[9px] font-black uppercase tracking-[.2em] text-blue-400">HR Foundation</div><div className="mt-1.5 text-base font-black text-white">İnsan Kaynakları</div><div className="mt-1 text-[9px] text-slate-600">{user.companyId} · {user.role}</div></div>
      {SECTIONS.map(item => { const Icon = item.icon; const active = item.id === section; return <button key={item.id} onClick={() => setSection(item.id)} className={`flex min-h-11 min-w-0 items-center gap-2.5 rounded-xl px-3 text-left text-[10px] font-bold transition sm:gap-3 ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-950/25" : "text-slate-500 hover:bg-white/[.04] hover:text-slate-200"}`}><Icon size={15} className="shrink-0"/><span className="truncate">{item.label}</span></button>; })}
    </aside>
    <section className="grid min-h-0 grid-rows-[auto_1fr] gap-4">
      <header className="mether-surface flex items-center justify-between rounded-[24px] px-5 py-4 sm:px-6"><div><div className="text-[9px] font-black uppercase tracking-[.18em] text-blue-400">HR · {selected.label}</div><h1 className="mt-1.5 text-xl font-black text-white sm:text-2xl">{selected.label}</h1></div><button onClick={() => void refresh()} disabled={loading} aria-label="Verileri yenile" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[.07] text-slate-500 transition hover:bg-white/[.04] hover:text-blue-300"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/></button></header>
      <div className="mether-scroll min-h-0 overflow-y-auto pr-0.5 sm:pr-1">{error ? <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] text-rose-200">{error}</div> : null}
        {section === "dashboard" ? <Dashboard snapshot={snapshot}/> : null}{section === "employees" ? canManage ? <WorkforceModule embedded/> : <FoundationList title="Çalışanlar" count={snapshot?.employees.length ?? 0} description="Yalnız yetki kapsamınızdaki çalışanlar gösterilir."/> : null}
        {section === "organizations" ? <OrganizationCenter canManage={canManage} initialLevel="organization" snapshot={snapshot} execute={execute}/> : null}
        {section === "departments" ? <OrganizationCenter canManage={canManage} initialLevel="department" snapshot={snapshot} execute={execute}/> : null}
        {section === "teams" ? <OrganizationCenter canManage={canManage} initialLevel="team" snapshot={snapshot} execute={execute}/> : null}
        {section === "documents" ? <Documents canManage={canManage} snapshot={snapshot} execute={execute}/> : null}
        {section === "personnel-file" ? <PersonnelFiles employees={snapshot?.employees ?? []}/> : null}
        {section === "identity-settings" ? <PersonIdentitySettings/> : null}
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
  return <div className="grid gap-4"><div className="grid grid-cols-2 gap-3 xl:grid-cols-3">{cards.map(([label, value, Icon]) => <article key={label} className="mether-surface rounded-[22px] p-4 sm:p-5"><div className="flex items-center justify-between gap-3 text-[8px] font-black uppercase tracking-[.14em] text-slate-500 sm:text-[9px]">{label}<Icon size={16} className="shrink-0 text-blue-400"/></div><div className="mt-5 text-2xl font-black text-white sm:text-3xl">{value}</div></article>)}</div><article className="mether-surface rounded-[24px] p-5 sm:p-6"><div className="text-[9px] font-black uppercase tracking-[.18em] text-blue-400">Company → Organization → Department → Team → Employee</div><div className="mt-5 grid gap-3 lg:grid-cols-2">{snapshot?.organizations.map(org => <div key={org.id} className="rounded-2xl border border-white/[.06] bg-black/10 p-4 sm:p-5"><div className="text-sm font-black text-white">{org.name}</div><div className="mt-1 text-[9px] text-blue-300">{org.code}</div><div className="mt-4 text-[9px] text-slate-500">{snapshot.departments.filter(dep => dep.organizationId === org.id).length} departman</div></div>)}{!snapshot?.organizations.length ? <Empty text="İlk organizasyonu Organizasyonlar bölümünden oluştur."/> : null}</div></article></div>;
}

function Documents({ snapshot, execute, canManage }: { snapshot: Snapshot; execute: Execute; canManage: boolean }) {
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); await execute({ action: "CREATE_DOCUMENT", title, content }); setTitle(""); setContent(""); }
  return <div className={`grid gap-3 ${canManage ? "lg:grid-cols-[360px_1fr]" : ""}`}>{canManage ? <form onSubmit={submit} className="mether-surface rounded-[24px] p-4"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Dijital Belge Oluştur</div><div className="mt-4 space-y-3"><input required value={title} onChange={event => setTitle(event.target.value)} className={inputClass} placeholder="Belge başlığı"/><textarea required value={content} onChange={event => setContent(event.target.value)} className={`${inputClass} h-32 py-3`} placeholder="Belge içeriği"/><button className="h-11 w-full rounded-xl bg-blue-600 text-[10px] font-black text-white">Taslak Oluştur</button></div></form> : null}<div className="mether-surface rounded-[24px] p-4"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Belgeler · {snapshot?.documents.length ?? 0}</div><div className="mt-4 space-y-2">{snapshot?.documents.map(doc => <div key={doc.id} className="rounded-2xl border border-white/[.06] bg-black/10 p-4"><div className="text-[11px] font-black text-white">{doc.title}</div><div className="mt-1 text-[9px] text-blue-300">{doc.documentCode} · v{doc.version}</div><div className="mt-3 text-[8px] text-slate-600">{doc.recipientCount} alıcı · gönder → oku → onayla → audit</div></div>)}{!snapshot?.documents.length ? <Empty text="Henüz dijital belge yok."/> : null}</div></div></div>;
}

function PersonnelFiles({ employees }: { employees: NonNullable<Snapshot>["employees"] }) { const categories = ["Kimlik", "Belgeler", "Bordrolar", "Sözleşmeler", "Sertifikalar", "İzin Geçmişi", "Zimmet"]; return <div className="grid gap-3 lg:grid-cols-[300px_1fr]"><div className="mether-surface rounded-[24px] p-4"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Çalışanlar · {employees.length}</div><div className="mt-4 space-y-2">{employees.map(employee => <div key={employee.id} className="rounded-xl border border-white/[.06] p-3"><div className="text-[10px] font-black text-white">{employee.displayName}</div><div className="mt-1 text-[8px] text-blue-300">{employee.employeeCode}</div></div>)}</div></div><div className="mether-surface rounded-[24px] p-4"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Dijital Personel Dosyası</div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{categories.map(category => <div key={category} className="rounded-2xl border border-white/[.06] bg-black/10 p-4"><FolderArchive size={17} className="text-blue-400"/><div className="mt-3 text-[10px] font-black text-white">{category}</div></div>)}</div></div></div>; }

function PersonIdentitySettings() {
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
    <section className="mether-surface rounded-[24px] p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-white/[.06] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="text-[9px] font-black uppercase tracking-[.18em] text-blue-400">HR Settings</div><h2 className="mt-2 text-xl font-black text-white sm:text-2xl">Personel Kimliği</h2><p className="mt-2 max-w-2xl text-[10px] leading-5 text-slate-500">Şirketin personel kimliği ve QR kullanım tercihleri için hazırlanmış arayüz planı.</p></div>
        <span className="w-fit rounded-full border border-amber-400/15 bg-amber-400/[.07] px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-amber-300">Tasarım Planı</span>
      </div>
      <div className="mt-5 rounded-2xl border border-blue-400/15 bg-blue-500/[.05] p-4 text-[10px] leading-5 text-blue-200">Bu seçenekler henüz kaydedilmez. Mevcut veri, API ve QR davranışı değiştirilmeden gelecek ayar deneyimi gösterilmektedir.</div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <IdentityTechnology icon={QrCode} title="QR" description="Mevcut personel doğrulaması" state="Mevcut" active />
        <IdentityTechnology icon={Nfc} title="NFC" description="Temassız personel kimliği" state="Planlandı" />
        <IdentityTechnology icon={Fingerprint} title="Dijital Kimlik" description="Mobil kimlik görünümü" state="Planlandı" />
        <IdentityTechnology icon={CreditCard} title="Personel Kartı" description="Basılı kurumsal kimlik" state="Planlandı" />
      </div>
      <div className="mt-5 space-y-2">
        <IdentitySetting icon={QrCode} title="QR oluşturma" description="Personel oluşturulduğunda QR üretim tercihinin şirket bazında yönetimi." value="Otomatik üret · mevcut davranış" />
        <IdentitySetting icon={QrCode} title="Otomatik QR kapalı" description="Otomatik üretim kullanılmadığında seçilebilecek alternatif tercih." value="Planlandı" />
        <IdentitySetting icon={IdCard} title="QR formatı" description="Personel kimliğinde kullanılacak ortak platform QR sözleşmesi." value="AL METHER Personel V1" />
        <IdentitySetting icon={IdCard} title="Personel kartına QR ekle" description="Basılabilir personel kartında QR alanının gösterimi." value="Planlandı" />
        <IdentitySetting icon={FileDown} title="Toplu QR PDF oluştur" description="Seçili personel kimliklerini tek PDF çıktısında hazırlama." value="Planlandı" />
        <IdentitySetting icon={ScanLine} title="QR tarama durumu" description="Personel QR taramasını şirket kapsamında etkin veya pasif yapma." value="Etkin / Pasif · planlandı" />
      </div>
    </section>
    <aside className="mether-surface rounded-[24px] p-5 sm:p-6">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/[.09] text-blue-300"><Fingerprint size={19}/></div>
      <h3 className="mt-5 text-base font-black text-white">Kimlik teknolojileri</h3>
      <p className="mt-2 text-[10px] leading-6 text-slate-500">Personel Kimliği QR ile sınırlı değildir. HR, personelin QR, NFC, dijital kimlik ve kart deneyimini yönetir; ortak servis diğer varlık türlerinde platforma hizmet eder.</p>
      <div className="mt-5 grid grid-cols-2 gap-2">{["Personel", "Araç", "Zimmet", "Belge", "İş Emri"].map((item, index) => <div key={item} className={`rounded-xl border border-white/[.06] px-3 py-3 text-[9px] font-bold ${index === 0 ? "bg-blue-500/[.08] text-blue-300" : "bg-black/10 text-slate-600"}`}>{item}</div>)}</div>
    </aside>
  </div>;
}

function IdentityTechnology({ icon: Icon, title, description, state, active = false }: { icon: typeof QrCode; title: string; description: string; state: string; active?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${active ? "border-blue-400/20 bg-blue-500/[.06]" : "border-white/[.06] bg-black/10"}`}><Icon size={17} className={active ? "text-blue-300" : "text-slate-600"}/><div className="mt-4 text-[10px] font-black text-white">{title}</div><p className="mt-1 text-[8px] leading-4 text-slate-600">{description}</p><div className={`mt-3 text-[7px] font-black uppercase tracking-[.12em] ${active ? "text-blue-300" : "text-slate-600"}`}>{state}</div></div>;
}

function IdentitySetting({ icon: Icon, title, description, value }: { icon: typeof QrCode; title: string; description: string; value: string }) {
  return <div className="flex flex-col gap-3 rounded-2xl border border-white/[.06] bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-500/[.08] text-blue-300"><Icon size={15}/></div><div><div className="text-[11px] font-black text-white">{title}</div><p className="mt-1 text-[9px] leading-4 text-slate-500">{description}</p></div></div><span className="w-fit shrink-0 rounded-xl border border-white/[.06] bg-white/[.025] px-3 py-2 text-[8px] font-black text-slate-400">{value}</span></div>;
}
function FoundationList({ title, count, description }: { title: string; count: number; description: string }) { return <article className="mether-surface rounded-[24px] p-6"><div className="text-[9px] font-black uppercase tracking-[.18em] text-blue-400">HR Foundation</div><div className="mt-3 flex items-end gap-3"><h2 className="text-2xl font-black text-white">{title}</h2><span className="text-2xl font-black text-blue-300">{count}</span></div><p className="mt-4 max-w-2xl text-[11px] leading-6 text-slate-500">{description}</p><div className="mt-6 rounded-2xl border border-dashed border-white/[.08] p-8 text-center text-[10px] text-slate-600">Temel veri modeli, repository ve RLS hazır. Kayıtlar oluştukça bu alan otomatik dolacak.</div></article>; }
function Empty({ text }: { text: string }) { return <div className="col-span-full rounded-2xl border border-dashed border-white/[.08] bg-black/10 p-7 text-center text-[10px] leading-5 text-slate-500">{text}</div>; }

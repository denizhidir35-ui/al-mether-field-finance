"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import {
  ArrowLeft,
  BadgePlus,
  BriefcaseBusiness,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileStack,
  History,
  KeyRound,
  PackageCheck,
  Phone,
  QrCode,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRound,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import type { WorkforceMember, WorkforceRole } from "../domain/workforce";
import { createWorkforceMember, listWorkforce, resetChiefPin, updatePersonnelChief } from "../services/workforce-client";

type Screen = "LIST" | "CREATE" | "DETAIL";
type SortMode = "NAME" | "CODE";

const inputClass = "h-12 w-full rounded-2xl border border-white/[0.07] bg-black/20 px-4 text-[12px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/35";

export function WorkforceModule({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<WorkforceRole>("CHIEF");
  const [screen, setScreen] = useState<Screen>("LIST");
  const [members, setMembers] = useState<WorkforceMember[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("Saha Personeli");
  const [phone, setPhone] = useState("");
  const [assignedChiefCode, setAssignedChiefCode] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [editChiefCode, setEditChiefCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("NAME");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const chiefs = useMemo(() => members.filter(item => item.role === "CHIEF"), [members]);
  const activeChiefs = useMemo(() => chiefs.filter(chief => chief.status === "ACTIVE"), [chiefs]);
  const selected = members.find(item => item.employeeCode === selectedCode) ?? null;
  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
    return members
      .filter(item => item.role === tab)
      .filter(item => !normalizedQuery || [item.displayName, item.employeeCode, item.title, item.assignedChiefCode].some(value => value?.toLocaleLowerCase("tr-TR").includes(normalizedQuery)))
      .sort((left, right) => (sortMode === "NAME" ? left.displayName.localeCompare(right.displayName, "tr-TR") : left.employeeCode.localeCompare(right.employeeCode, "tr-TR")));
  }, [members, query, sortMode, tab]);

  async function refresh(preferredCode?: string) {
    setLoading(true);
    try {
      const next = await listWorkforce();
      setMembers(next);
      if (preferredCode) setSelectedCode(preferredCode);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "HR kayıtları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    setEditChiefCode(selected?.role === "PERSONNEL" ? selected.assignedChiefCode ?? "" : "");
    if (!selected?.qrValue) { setQrDataUrl(""); return; }
    void QRCode.toDataURL(selected.qrValue, { width: 280, margin: 2, color: { dark: "#081225", light: "#ffffff" } }).then(setQrDataUrl);
  }, [selected?.assignedChiefCode, selected?.employeeCode, selected?.qrValue, selected?.role]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = tab === "CHIEF"
        ? await createWorkforceMember({ role: "CHIEF", displayName })
        : await createWorkforceMember({ role: "PERSONNEL", displayName, title, assignedChiefCode, phone });
      setDisplayName("");
      setPhone("");
      await refresh(result.member.employeeCode);
      setScreen("DETAIL");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Kayıt oluşturulamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function changePersonnelChief() {
    if (!selected || selected.role !== "PERSONNEL" || !editChiefCode) return;
    setBusy(true);
    try {
      await updatePersonnelChief(selected.employeeCode, editChiefCode);
      await refresh(selected.employeeCode);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Şef ataması değiştirilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function changeChiefPin() {
    if (!selected || selected.role !== "CHIEF") return;
    setBusy(true);
    try {
      await resetChiefPin(selected.employeeCode);
      await refresh(selected.employeeCode);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "PIN sıfırlanamadı.");
    } finally {
      setBusy(false);
    }
  }

  function changeTab(next: WorkforceRole) {
    setTab(next);
    setScreen("LIST");
    setSelectedCode(null);
    setQuery("");
    setError("");
  }

  function openDetail(member: WorkforceMember) {
    setSelectedCode(member.employeeCode);
    setScreen("DETAIL");
    setError("");
  }

  const singularLabel = tab === "CHIEF" ? "Şef" : "Personel";

  return (
    <div className={`grid h-full min-h-0 gap-4 ${embedded ? "grid-rows-[auto_1fr]" : "lg:grid-rows-[auto_1fr]"}`}>
      <header className={embedded ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end" : "mether-surface flex flex-col gap-4 rounded-[24px] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"}>
        {!embedded ? <div><div className="text-[9px] font-black uppercase tracking-[.2em] text-blue-400">HR</div><h1 className="mt-1.5 text-2xl font-black text-white">Şef ve Personel Yönetimi</h1></div> : null}
        <div className="grid w-full grid-cols-2 rounded-2xl border border-white/[.07] bg-black/20 p-1 sm:w-auto sm:min-w-[300px]">
          <button type="button" onClick={() => changeTab("CHIEF")} className={`h-11 rounded-xl px-3 text-[10px] font-black transition sm:px-5 ${tab === "CHIEF" ? "bg-blue-600 text-white shadow-lg shadow-blue-950/25" : "text-slate-500 hover:text-white"}`}>Şef Yönetimi</button>
          <button type="button" onClick={() => changeTab("PERSONNEL")} className={`h-11 rounded-xl px-3 text-[10px] font-black transition sm:px-5 ${tab === "PERSONNEL" ? "bg-blue-600 text-white shadow-lg shadow-blue-950/25" : "text-slate-500 hover:text-white"}`}>Personel Yönetimi</button>
        </div>
      </header>

      {error ? <div role="alert" className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[10px] text-rose-200">{error}</div> : null}

      {screen === "LIST" ? (
        <WorkforceList
          tab={tab}
          visible={visible}
          query={query}
          sortMode={sortMode}
          loading={loading}
          onQueryChange={setQuery}
          onSortChange={setSortMode}
          onRefresh={() => void refresh()}
          onCreate={() => setScreen("CREATE")}
          onSelect={openDetail}
        />
      ) : null}

      {screen === "CREATE" ? (
        <form onSubmit={submit} className="mether-surface mether-scroll min-h-0 overflow-y-auto rounded-[24px] p-5 sm:p-6">
          <ScreenHeader eyebrow={`Yeni ${singularLabel}`} title={`${singularLabel} oluştur`} description="Gerekli bilgileri tamamlayın. Personel kodu sistem tarafından otomatik oluşturulur." onBack={() => setScreen("LIST")} />
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <FormGroup title="Kişisel Bilgiler" icon={UserRound}>
              <Field label="Ad Soyad"><input aria-label="Ad Soyad" required value={displayName} onChange={event => setDisplayName(event.target.value)} className={inputClass} placeholder="Ad ve soyad" autoComplete="name" /></Field>
            </FormGroup>
            {tab === "PERSONNEL" ? <>
              <FormGroup title="İletişim" icon={Phone}>
                <Field label="Telefon"><input aria-label="Telefon" required value={phone} onChange={event => setPhone(event.target.value)} className={inputClass} placeholder="+90 5xx xxx xx xx" inputMode="tel" autoComplete="tel" /></Field>
              </FormGroup>
              <FormGroup title="Organizasyon" icon={UsersRound}>
                <Field label="Bağlı Şef"><select aria-label="Şef" required value={assignedChiefCode} onChange={event => setAssignedChiefCode(event.target.value)} className={inputClass}><option value="">Şef seçin</option>{activeChiefs.map(chief => <option key={chief.id} value={chief.employeeCode}>{chief.employeeCode} · {chief.displayName}</option>)}</select></Field>
              </FormGroup>
              <FormGroup title="İş Bilgileri" icon={BriefcaseBusiness}>
                <Field label="Görev"><input aria-label="Görev" required value={title} onChange={event => setTitle(event.target.value)} className={inputClass} placeholder="Görev" /></Field>
              </FormGroup>
            </> : null}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/[.06] pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setScreen("LIST")} className="h-12 rounded-2xl border border-white/[.08] px-5 text-[10px] font-black text-slate-400 transition hover:text-white">Vazgeç</button>
            <button disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-[10px] font-black text-white transition hover:bg-blue-500 disabled:opacity-50"><BadgePlus size={16} />{busy ? "Kaydediliyor..." : `${singularLabel} Oluştur`}</button>
          </div>
        </form>
      ) : null}

      {screen === "DETAIL" && selected ? (
        <section className="mether-surface mether-scroll min-h-0 overflow-y-auto rounded-[24px] p-5 sm:p-6">
          <ScreenHeader eyebrow="Çalışan Detayı" title={selected.displayName} description={`${selected.employeeCode} · ${selected.role === "CHIEF" ? "Saha Şefi" : selected.title ?? "Personel"}`} onBack={() => setScreen("LIST")} />
          {selected.role === "PERSONNEL" ? <PersonnelLifecycle member={selected} /> : null}
          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <DetailGroup title="Temel Bilgiler">
                <DetailValue label="Ad Soyad" value={selected.displayName} />
                <DetailValue label="Görev" value={selected.role === "CHIEF" ? "Saha Şefi" : selected.title ?? "Belirtilmemiş"} />
                <DetailValue label="Durum" value={selected.status} tone={selected.status === "ACTIVE" ? "success" : "default"} />
              </DetailGroup>
              {selected.role === "PERSONNEL" ? <DetailGroup title="KİMLİK"><DetailValue label="Personel No" value={selected.employeeCode} /><DetailValue label="QR" value={selected.qrValue ? "Hazır" : "Oluşturulmamış"} tone={selected.qrValue ? "success" : "default"} /><DetailValue label="Dijital Kimlik" value="Tasarım planı" /><DetailValue label="Kart Durumu" value="Tasarım planı" /><DetailValue label="Son Taranma" value="Veri bağlantısı bekleniyor" /></DetailGroup> : <DetailGroup title="KİMLİK"><DetailValue label="Şef No" value={selected.employeeCode} /><DetailValue label="Giriş Kimliği" value="4 haneli PIN" /></DetailGroup>}
              {selected.role === "PERSONNEL" ? <DetailGroup title="Organizasyon"><Field label="Atanmış Şef"><select value={editChiefCode} onChange={event => setEditChiefCode(event.target.value)} className={inputClass}>{activeChiefs.map(chief => <option key={chief.id} value={chief.employeeCode}>{chief.employeeCode} · {chief.displayName}</option>)}</select></Field><button type="button" disabled={busy || !editChiefCode || editChiefCode === selected.assignedChiefCode} onClick={() => void changePersonnelChief()} className="h-11 w-full rounded-xl bg-blue-600 px-4 text-[9px] font-black text-white transition hover:bg-blue-500 disabled:opacity-40 sm:w-auto">Şef Atamasını Kaydet</button></DetailGroup> : null}
              {selected.role === "PERSONNEL" ? <PlannedPersonnelSections /> : null}
            </div>
            <aside className="rounded-[22px] border border-white/[.06] bg-black/10 p-5">
              {selected.role === "PERSONNEL" ? <><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-blue-300"><QrCode size={15} /> Personel QR</div>{qrDataUrl ? <div className="mt-5 rounded-2xl bg-white p-3"><img src={qrDataUrl} alt={`${selected.employeeCode} QR`} className="mx-auto w-[180px]" /><div className="mt-1 text-center text-[9px] font-black text-slate-900">{selected.employeeCode}</div></div> : null}<p className="mt-4 text-[9px] leading-5 text-slate-500">QR kodu otomatik oluşturuldu ve saha doğrulamasında kullanıma hazır.</p></> : <><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-amber-300"><KeyRound size={15} /> 4 Haneli PIN</div><div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[.05] p-5"><div className="font-mono text-3xl font-black tracking-[.28em] text-white">{selected.temporaryPin ?? "----"}</div><p className="mt-3 text-[9px] leading-5 text-slate-500">Şef, personel numarası ve bu PIN ile giriş yapar.</p></div><button type="button" disabled={busy} onClick={() => void changeChiefPin()} className="mt-3 h-11 w-full rounded-xl border border-blue-400/20 bg-blue-500/[.08] text-[9px] font-black text-blue-300 disabled:opacity-40">Yeni PIN Oluştur</button></>}
            </aside>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function WorkforceList({ tab, visible, query, sortMode, loading, onQueryChange, onSortChange, onRefresh, onCreate, onSelect }: {
  tab: WorkforceRole;
  visible: WorkforceMember[];
  query: string;
  sortMode: SortMode;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSortChange: (value: SortMode) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onSelect: (member: WorkforceMember) => void;
}) {
  const singularLabel = tab === "CHIEF" ? "Şef" : "Personel";
  return <section className="mether-surface min-h-0 overflow-hidden rounded-[24px] p-4 sm:p-5">
    <div className="flex flex-col gap-4 border-b border-white/[.06] pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">{tab === "CHIEF" ? "Şefler" : "Personeller"}</div><h2 className="mt-1.5 text-xl font-black text-white">{visible.length} kayıt</h2></div>
      <button type="button" onClick={onCreate} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-[10px] font-black text-white transition hover:bg-blue-500"><BadgePlus size={16} />{singularLabel} Ekle</button>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px_auto]">
      <label className="relative block"><span className="sr-only">Kayıtlarda ara</span><Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" /><input value={query} onChange={event => onQueryChange(event.target.value)} className={`${inputClass} pl-11`} placeholder="Ad, kod veya görev ara" /></label>
      <label className="relative block"><span className="sr-only">Sıralama</span><SlidersHorizontal size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" /><select value={sortMode} onChange={event => onSortChange(event.target.value as SortMode)} className={`${inputClass} pl-10`}><option value="NAME">Ada göre sırala</option><option value="CODE">Koda göre sırala</option></select></label>
      <button type="button" onClick={onRefresh} aria-label="Kayıtları yenile" className="grid h-12 w-full place-items-center rounded-2xl border border-white/[.07] text-slate-500 transition hover:text-blue-300 sm:w-12"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /></button>
    </div>
    <div className="mether-scroll mt-4 grid max-h-[52vh] gap-2 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
      {loading ? Array.from({ length: 6 }, (_, index) => <LoadingCard key={index} />) : visible.map(member => <button key={member.id} type="button" onClick={() => onSelect(member)} className="group rounded-2xl border border-white/[.055] bg-black/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-blue-500/[.04]"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/[.09] text-[11px] font-black text-blue-300">{initials(member.displayName)}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="truncate text-[12px] font-black text-white">{member.displayName}</div><ChevronRight size={15} className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-blue-300" /></div><div className="mt-1 truncate text-[9px] text-slate-500">{member.role === "CHIEF" ? "Saha Şefi" : member.title ?? "Personel"}</div></div></div><div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[.05] pt-3"><span className="text-[9px] font-black text-blue-300">{member.employeeCode}</span><span className={`text-[8px] font-black uppercase tracking-[.1em] ${member.status === "ACTIVE" ? "text-emerald-300" : "text-slate-500"}`}>{member.status}</span></div>{member.role === "PERSONNEL" ? <div className="mt-2 truncate text-[8px] text-slate-600">Bağlı şef: {member.assignedChiefCode ?? "Atanmamış"}</div> : null}</button>)}
      {!loading && visible.length === 0 ? <div className="col-span-full rounded-2xl border border-dashed border-white/[.09] bg-black/10 p-8 text-center"><UsersRound size={22} className="mx-auto text-blue-300" /><div className="mt-4 text-[12px] font-black text-white">{query ? "Aramanızla eşleşen kayıt yok" : `Henüz ${singularLabel.toLocaleLowerCase("tr-TR")} bulunmuyor`}</div><p className="mt-2 text-[10px] text-slate-500">{query ? "Arama ifadenizi değiştirerek tekrar deneyin." : "İlk kaydınızı oluşturarak başlayabilirsiniz."}</p>{!query ? <button type="button" onClick={onCreate} className="mt-5 h-11 rounded-xl bg-blue-600 px-5 text-[10px] font-black text-white">{singularLabel} Ekle</button> : null}</div> : null}
    </div>
  </section>;
}

function ScreenHeader({ eyebrow, title, description, onBack }: { eyebrow: string; title: string; description: string; onBack: () => void }) {
  return <div className="flex items-start gap-3 border-b border-white/[.06] pb-5"><button type="button" onClick={onBack} aria-label="Listeye dön" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[.07] text-slate-500 transition hover:text-white"><ArrowLeft size={17} /></button><div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">{eyebrow}</div><h2 className="mt-1.5 text-xl font-black text-white sm:text-2xl">{title}</h2><p className="mt-1 text-[10px] leading-5 text-slate-500">{description}</p></div></div>;
}

function FormGroup({ title, icon: Icon, children }: { title: string; icon: typeof UserRound; children: React.ReactNode }) {
  return <fieldset className="rounded-[22px] border border-white/[.06] bg-black/10 p-4 sm:p-5"><legend className="sr-only">{title}</legend><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-blue-300"><Icon size={15} />{title}</div><div className="mt-4 space-y-3">{children}</div></fieldset>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-slate-500">{label}</span>{children}</label>;
}

function PersonnelLifecycle({ member }: { member: WorkforceMember }) {
  const qrReady = Boolean(member.qrValue);
  const steps = [
    ["Taslak Personel", "Plan"],
    ["Çalışan Oluşturuldu", "Doğrulandı"],
    ["Telefon Aktivasyonu", "Plan"],
    ["İlk Giriş", "Plan"],
    ["QR / Kimlik", qrReady ? "Doğrulandı" : "Bekliyor"],
    ["Belgeler", "Plan"],
    ["Zimmet", "Plan"],
    ["Aktif Çalışan", member.status],
    ["İzin / Performans", "Plan"],
    ["Ayrılış / Arşiv", "Plan"],
  ] as const;
  const nextAction = qrReady ? "Telefon aktivasyonu durumunu doğrula" : "Personel kimliği için QR durumunu kontrol et";
  return <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
    <section className="rounded-[22px] border border-white/[.06] bg-black/10 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-blue-300"><History size={15}/> Personel Yaşam Döngüsü</div><p className="mt-2 text-[9px] leading-5 text-slate-500">Kronolojik deneyim planı; doğrulanmayan aşamalar canlı durum olarak gösterilmez.</p></div><span className="w-fit rounded-full border border-amber-400/15 bg-amber-400/[.06] px-3 py-2 text-[8px] font-black text-amber-300">UX Planı</span></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{steps.map(([label, state], index) => { const verified = state === "Doğrulandı"; return <div key={label} className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 ${verified ? "border-emerald-400/15 bg-emerald-400/[.04]" : "border-white/[.05] bg-black/10"}`}><div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[8px] font-black ${verified ? "bg-emerald-400/[.1] text-emerald-300" : "bg-white/[.035] text-slate-600"}`}>{verified ? <CircleCheck size={14}/> : index + 1}</div><div className="min-w-0"><div className="truncate text-[9px] font-black text-white">{label}</div><div className={`mt-1 text-[7px] font-black uppercase tracking-[.1em] ${verified ? "text-emerald-300" : state === "Bekliyor" ? "text-amber-300" : "text-slate-600"}`}>{state}</div></div></div>; })}</div>
    </section>
    <aside className="rounded-[22px] border border-blue-400/15 bg-blue-500/[.05] p-5"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-blue-300"><Clock3 size={15}/> Sonraki Mantıklı Adım</div><div className="mt-4 text-[13px] font-black leading-6 text-white">{nextAction}</div><p className="mt-2 text-[9px] leading-5 text-slate-500">Bu öneri mevcut kayıttaki doğrulanabilir kimlik bilgisine dayanır; canlı görev veya backend durumu değildir.</p></aside>
  </div>;
}

function PlannedPersonnelSections() {
  const sections = [
    ["İletişim", "Telefon ve iletişim doğrulaması", Phone],
    ["Belgeler", "Belge tamamlama görünümü", FileStack],
    ["Zimmet", "Teslim ve iade özeti", PackageCheck],
    ["Aktivasyon", "İlk giriş ve hesap durumu", Clock3],
    ["Geçmiş", "Kronolojik personel hareketleri", History],
  ] as const;
  return <section className="rounded-[22px] border border-dashed border-white/[.08] bg-black/10 p-4 sm:p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-[9px] font-black uppercase tracking-[.14em] text-blue-300">Yaşam Döngüsü Bilgi Alanları</h3><p className="mt-2 text-[9px] leading-5 text-slate-500">Mevcut detay deneyiminin gelecekte destekleyeceği kronolojik gruplar.</p></div><span className="w-fit text-[8px] font-black uppercase tracking-[.12em] text-slate-600">Tasarım Planı</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{sections.map(([title, description, Icon]) => <div key={title} className="flex items-center gap-3 rounded-xl border border-white/[.05] bg-black/10 p-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-500/[.07] text-blue-300"><Icon size={14}/></div><div><div className="text-[9px] font-black text-white">{title}</div><div className="mt-1 text-[8px] text-slate-600">{description}</div></div></div>)}</div></section>;
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[22px] border border-white/[.06] bg-black/10 p-4 sm:p-5"><h3 className="text-[9px] font-black uppercase tracking-[.14em] text-blue-300">{title}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div></section>;
}

function DetailValue({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" }) {
  return <div className="rounded-2xl border border-white/[.05] bg-black/10 p-4"><div className="text-[8px] font-black uppercase tracking-[.12em] text-slate-600">{label}</div><div className={`mt-2 text-[11px] font-black ${tone === "success" ? "text-emerald-300" : "text-white"}`}>{value}</div></div>;
}

function LoadingCard() {
  return <div className="animate-pulse rounded-2xl border border-white/[.05] bg-black/10 p-4"><div className="flex gap-3"><div className="h-10 w-10 rounded-xl bg-white/[.05]" /><div className="flex-1"><div className="h-3 w-2/3 rounded bg-white/[.06]" /><div className="mt-2 h-2 w-1/2 rounded bg-white/[.04]" /></div></div><div className="mt-5 h-8 rounded-xl bg-white/[.03]" /></div>;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toLocaleUpperCase("tr-TR")).join("") || "--";
}

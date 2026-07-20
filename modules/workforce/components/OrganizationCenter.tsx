"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Building2, ChevronDown, ChevronRight, Network, Plus, ShieldCheck, UsersRound } from "lucide-react";
import type { HrCreateCommand, HrDepartment, HrEmployee, HrFoundationSnapshot, HrOrganization, HrTeam } from "../domain/hr-foundation";

type Level = "organization" | "department" | "team";
type Creator = { level: Level; parentId?: string; parentName?: string } | null;
type Execute = (command: HrCreateCommand) => Promise<unknown>;

const inputClass = "h-12 w-full rounded-2xl border border-white/[.07] bg-black/20 px-4 text-[12px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/35";

export function OrganizationCenter({ snapshot, execute, canManage, initialLevel }: { snapshot: HrFoundationSnapshot | null; execute: Execute; canManage: boolean; initialLevel: Level }) {
  const [creator, setCreator] = useState<Creator>(initialLevel === "organization" ? { level: "organization" } : null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [employeeScope, setEmployeeScope] = useState<string | null>(null);

  const data = useMemo(() => ({
    organizations: snapshot?.organizations ?? [],
    departments: snapshot?.departments ?? [],
    teams: snapshot?.teams ?? [],
    employees: snapshot?.employees ?? [],
  }), [snapshot]);

  function toggle(id: string) {
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openCreator(next: NonNullable<Creator>) {
    setCreator(next);
    setEmployeeScope(null);
  }

  const hasStructure = data.organizations.length > 0;
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
    <section className="mether-surface rounded-[24px] p-4 sm:p-5">
      <div className="flex flex-col gap-4 border-b border-white/[.06] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-blue-400">Organizasyon Merkezi</div>
          <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">Organizasyon Yapısı</h2>
          <p className="mt-2 max-w-2xl text-[10px] leading-5 text-slate-500">Şirket yapısını, sorumlulukları ve çalışan dağılımını tek görünümde okuyun.</p>
        </div>
        {canManage ? <button type="button" onClick={() => openCreator({ level: "organization" })} className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-[9px] font-black text-white transition hover:bg-blue-500"><Plus size={15}/> Organizasyon Ekle</button> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[8px] font-black uppercase tracking-[.12em] text-slate-600">
        <span className="rounded-lg border border-blue-400/15 bg-blue-500/[.05] px-2.5 py-2 text-blue-300">Organizasyon</span><ChevronRight size={12}/><span>Departman</span><ChevronRight size={12}/><span>Takım</span>
        <span className="ml-auto normal-case tracking-normal text-slate-600">Yapı, yeni seviye adları eklenebilecek şekilde düğüm temelli gösterilir.</span>
      </div>

      {!hasStructure ? <div className="mether-empty-state mt-5 rounded-[22px] p-7 text-center"><Building2 size={24} className="mx-auto text-blue-500"/><h3 className="mt-4 text-sm font-black text-white">Organizasyon yapısı henüz kurulmadı</h3><p className="mx-auto mt-2 max-w-lg text-[10px] leading-5 text-slate-500">İlk organizasyonu oluşturun; ardından departman ve takımları aynı ekran içinde ekleyebilirsiniz.</p>{canManage ? <button type="button" onClick={() => openCreator({ level: "organization" })} className="mether-button-primary mt-5 h-11 rounded-2xl px-5 text-[9px] font-black">İlk Organizasyonu Oluştur</button> : null}</div> : null}

      {hasStructure ? <div className="mt-5 space-y-3">{data.organizations.map(organization => <OrganizationNode key={organization.id} organization={organization} departments={data.departments.filter(item => item.organizationId === organization.id)} teams={data.teams} employees={data.employees} expanded={expanded} employeeScope={employeeScope} onToggle={toggle} onEmployeeScope={setEmployeeScope} onCreate={openCreator} canManage={canManage}/>)}</div> : null}
    </section>

    <aside className="space-y-4">
      <StructureSummary snapshot={snapshot}/>
      {canManage ? <ContextCreator creator={creator} organizations={data.organizations} departments={data.departments} execute={execute} onClose={() => setCreator(null)}/> : null}
      <div className="mether-surface rounded-[24px] p-5"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Dijital Organizasyon Şeması</div><p className="mt-3 text-[10px] leading-6 text-slate-500">Bu görünüm HR, yetkilendirme, raporlama, workflow ve import süreçlerinin mevcut organizasyon referanslarını anlaşılır hale getirir. Veri modeli değiştirilmez.</p></div>
    </aside>
  </div>;
}

function OrganizationNode({ organization, departments, teams, employees, expanded, employeeScope, onToggle, onEmployeeScope, onCreate, canManage }: {
  organization: HrOrganization; departments: HrDepartment[]; teams: HrTeam[]; employees: HrEmployee[]; expanded: Set<string>; employeeScope: string | null;
  onToggle: (id: string) => void; onEmployeeScope: (id: string | null) => void; onCreate: (creator: NonNullable<Creator>) => void; canManage: boolean;
}) {
  const open = expanded.has(organization.id);
  const scopedEmployees = employees.filter(item => item.organizationId === organization.id);
  const scopedTeams = teams.filter(team => departments.some(department => department.id === team.departmentId));
  const managers = uniqueManagers([...departments.map(item => item.managerEmployeeCode), ...scopedTeams.map(item => item.managerEmployeeCode), ...scopedEmployees.filter(item => item.hrRole === "MANAGER").map(item => item.employeeCode)]);
  return <article className="rounded-[22px] border border-white/[.065] bg-black/10 p-3 sm:p-4">
    <NodeHeader icon={Building2} title={organization.name} code={organization.code} status={organization.status} open={open} onToggle={() => onToggle(organization.id)} metrics={[`${scopedEmployees.length} Personel`, `${departments.length} Departman`, `${scopedTeams.length} Takım`, `${managers} Yönetici`]}/>
    <NodeActions>{canManage ? <Action onClick={() => onCreate({ level: "department", parentId: organization.id, parentName: organization.name })}><Plus size={13}/> Departman Ekle</Action> : null}<Action onClick={() => onEmployeeScope(employeeScope === organization.id ? null : organization.id)}><UsersRound size={13}/> Çalışanları Gör</Action></NodeActions>
    {employeeScope === organization.id ? <EmployeeStrip employees={scopedEmployees}/> : null}
    {open ? <div className="mt-3 space-y-2 border-l border-blue-400/15 pl-3 sm:ml-4 sm:pl-4">{departments.map(department => <DepartmentNode key={department.id} department={department} teams={teams.filter(item => item.departmentId === department.id)} employees={employees.filter(item => item.departmentId === department.id)} expanded={expanded} employeeScope={employeeScope} onToggle={onToggle} onEmployeeScope={onEmployeeScope} onCreate={onCreate} canManage={canManage}/>)}{departments.length === 0 ? <InlineEmpty text="Bu organizasyonda henüz departman yok."/> : null}</div> : null}
  </article>;
}

function DepartmentNode({ department, teams, employees, expanded, employeeScope, onToggle, onEmployeeScope, onCreate, canManage }: {
  department: HrDepartment; teams: HrTeam[]; employees: HrEmployee[]; expanded: Set<string>; employeeScope: string | null;
  onToggle: (id: string) => void; onEmployeeScope: (id: string | null) => void; onCreate: (creator: NonNullable<Creator>) => void; canManage: boolean;
}) {
  const open = expanded.has(department.id);
  const managers = uniqueManagers([department.managerEmployeeCode, ...teams.map(item => item.managerEmployeeCode), ...employees.filter(item => item.hrRole === "MANAGER").map(item => item.employeeCode)]);
  return <div className="rounded-2xl border border-white/[.055] bg-[#091121]/70 p-3 sm:p-4">
    <NodeHeader icon={Network} title={department.name} code={department.code} status={department.status} open={open} onToggle={() => onToggle(department.id)} metrics={[`${employees.length} Personel`, `${teams.length} Takım`, `${managers} Yönetici`]}/>
    <NodeActions>{canManage ? <Action onClick={() => onCreate({ level: "team", parentId: department.id, parentName: department.name })}><Plus size={13}/> Takım Ekle</Action> : null}<Action onClick={() => onEmployeeScope(employeeScope === department.id ? null : department.id)}><UsersRound size={13}/> Çalışanları Gör</Action></NodeActions>
    {employeeScope === department.id ? <EmployeeStrip employees={employees}/> : null}
    {open ? <div className="mt-3 grid gap-2 border-l border-blue-400/10 pl-3 sm:grid-cols-2 sm:pl-4">{teams.map(team => <TeamNode key={team.id} team={team} employees={employees.filter(item => item.teamId === team.id)} employeeScope={employeeScope} onEmployeeScope={onEmployeeScope}/>)}{teams.length === 0 ? <InlineEmpty text="Bu departmanda henüz takım yok."/> : null}</div> : null}
  </div>;
}

function TeamNode({ team, employees, employeeScope, onEmployeeScope }: { team: HrTeam; employees: HrEmployee[]; employeeScope: string | null; onEmployeeScope: (id: string | null) => void }) {
  const managers = uniqueManagers([team.managerEmployeeCode, ...employees.filter(item => item.hrRole === "MANAGER").map(item => item.employeeCode)]);
  return <div className="rounded-xl border border-white/[.05] bg-black/15 p-3"><NodeHeader icon={ShieldCheck} title={team.name} code={team.code} status={team.status} metrics={[`${employees.length} Personel`, `${managers} Yönetici`]}/><NodeActions><Action onClick={() => onEmployeeScope(employeeScope === team.id ? null : team.id)}><UsersRound size={13}/> Çalışanları Gör</Action></NodeActions>{employeeScope === team.id ? <EmployeeStrip employees={employees}/> : null}</div>;
}

function NodeHeader({ icon: Icon, title, code, status, metrics, open, onToggle }: { icon: typeof Building2; title: string; code: string; status: string; metrics: string[]; open?: boolean; onToggle?: () => void }) {
  return <div className="flex items-start gap-3"><button type="button" onClick={onToggle} disabled={!onToggle} aria-label={onToggle ? `${title} alt birimlerini ${open ? "daralt" : "genişlet"}` : undefined} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/[.08] text-blue-300 disabled:cursor-default">{onToggle ? open ? <ChevronDown size={16}/> : <ChevronRight size={16}/> : <Icon size={16}/>}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[11px] font-black text-white sm:text-[12px]">{title}</h3><span className="text-[8px] font-black text-blue-300">{code}</span><span className={`rounded-full px-2 py-1 text-[7px] font-black uppercase ${status === "ACTIVE" ? "bg-emerald-400/[.07] text-emerald-300" : "bg-white/[.04] text-slate-500"}`}>{status}</span></div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{metrics.map(metric => <span key={metric} className="text-[8px] font-bold text-slate-500">{metric}</span>)}</div></div></div>;
}

function NodeActions({ children }: { children: React.ReactNode }) { return <div className="mt-3 flex flex-wrap gap-2 pl-[52px]">{children}</div>; }
function Action({ children, onClick }: { children: React.ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex min-h-9 items-center gap-1.5 rounded-xl border border-white/[.06] bg-white/[.02] px-3 text-[8px] font-black text-slate-400 transition hover:border-blue-400/20 hover:text-blue-200">{children}</button>; }

function EmployeeStrip({ employees }: { employees: HrEmployee[] }) {
  return <div className="mt-3 ml-[52px] rounded-xl border border-white/[.05] bg-black/15 p-3">{employees.length ? <div className="flex flex-wrap gap-2">{employees.map(employee => <span key={employee.id} className="rounded-lg border border-white/[.05] bg-white/[.025] px-2.5 py-2 text-[8px] font-bold text-slate-300">{employee.displayName} · {employee.employeeCode}</span>)}</div> : <div className="text-[8px] text-slate-600">Bu kapsamda çalışan bulunmuyor.</div>}</div>;
}

function StructureSummary({ snapshot }: { snapshot: HrFoundationSnapshot | null }) {
  const values = [["Organizasyon", snapshot?.organizations.length ?? 0, Building2], ["Departman", snapshot?.departments.length ?? 0, Network], ["Takım", snapshot?.teams.length ?? 0, ShieldCheck], ["Çalışan", snapshot?.employees.length ?? 0, UsersRound]] as const;
  return <div className="mether-surface rounded-[24px] p-5"><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Yapı Özeti</div><div className="mt-4 grid grid-cols-2 gap-2">{values.map(([label, value, Icon]) => <div key={label} className="rounded-xl border border-white/[.055] bg-black/10 p-3"><Icon size={14} className="text-blue-400"/><div className="mt-3 text-xl font-black text-white">{value}</div><div className="mt-1 text-[7px] font-black uppercase tracking-[.1em] text-slate-600">{label}</div></div>)}</div></div>;
}

function ContextCreator({ creator, organizations, departments, execute, onClose }: { creator: Creator; organizations: HrOrganization[]; departments: HrDepartment[]; execute: Execute; onClose: () => void }) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!creator) return null;
  const levelTitle = creator.level === "organization" ? "Organizasyon" : creator.level === "department" ? "Departman" : "Takım";
  const selectedParentId = creator.parentId ?? parentId;
  const parents = creator.level === "department" ? organizations : creator.level === "team" ? departments : [];
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (creator?.level === "organization") await execute({ action: "CREATE_ORGANIZATION", name });
      else if (creator?.level === "department") await execute({ action: "CREATE_DEPARTMENT", name, organizationId: selectedParentId });
      else if (creator?.level === "team") await execute({ action: "CREATE_TEAM", name, departmentId: selectedParentId });
      setName(""); onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Birim oluşturulamadı."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mether-surface rounded-[24px] p-5"><div className="flex items-start justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Bağlamsal Aksiyon</div><h3 className="mt-2 text-base font-black text-white">{levelTitle} Ekle</h3>{creator.parentName ? <p className="mt-1 text-[9px] text-slate-500">Üst birim: {creator.parentName}</p> : null}</div><button type="button" onClick={onClose} className="text-[9px] font-black text-slate-600 hover:text-white">Kapat</button></div>{error ? <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[8px] text-rose-200">{error}</div> : null}<div className="mt-4 space-y-3">{creator.level !== "organization" && !creator.parentId ? <select required value={parentId} onChange={event => setParentId(event.target.value)} className={inputClass}><option value="">Üst birim seç</option>{parents.map(parent => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select> : null}<input required value={name} onChange={event => setName(event.target.value)} className={inputClass} placeholder={`${levelTitle} adı`}/><button disabled={busy || (creator.level !== "organization" && !selectedParentId)} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[9px] font-black text-white disabled:opacity-40"><Plus size={14}/>{busy ? "Oluşturuluyor..." : `${levelTitle} Oluştur`}</button></div></form>;
}

function InlineEmpty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-white/[.06] p-3 text-[8px] text-slate-600">{text}</div>; }
function uniqueManagers(values: Array<string | null>) { return new Set(values.filter((value): value is string => Boolean(value))).size; }

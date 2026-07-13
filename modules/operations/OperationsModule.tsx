"use client";

import { useState } from "react";
import { FolderKanban, Map, PanelRight } from "lucide-react";
import type { AppUser } from "@/types/auth";
import { DailyOperationCard } from "./components/DailyOperationCard";
import { OperationMapCard } from "./components/OperationMapCard";
import { OperationsHeader } from "./components/OperationsHeader";
import { OperationsKPIs } from "./components/OperationsKPIs";
import { ProjectsList } from "./components/ProjectsList";
import { ProjectSummary } from "./components/ProjectSummary";
import { DAILY_OPERATION_METRICS, OPERATION_PROJECTS, OPERATIONS_KPIS } from "./operations.data";
import type { OperationProject } from "./types";

export function OperationsModule({ user: _user }: { user: AppUser }) {
  const [selectedProject, setSelectedProject] = useState<OperationProject>(OPERATION_PROJECTS[0]);
  const [activePanel, setActivePanel] = useState<"projects" | "map" | "summary">("map");

  return (
    <div className="operations-dashboard grid h-full min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] gap-1.5 xl:grid-rows-[auto_auto_minmax(0,1fr)_auto] xl:gap-2.5">
      <OperationsHeader />
      <OperationsKPIs items={OPERATIONS_KPIS} />
      <nav aria-label="Operations panel seçimi" className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.06] bg-black/10 p-1 xl:hidden">
        {([{ id: "projects", label: "Projeler", icon: FolderKanban }, { id: "map", label: "Harita", icon: Map }, { id: "summary", label: "Proje Özeti", icon: PanelRight }] as const).map(item => { const Icon = item.icon; const active = activePanel === item.id; return <button key={item.id} type="button" onClick={() => setActivePanel(item.id)} className={`flex h-7 items-center justify-center gap-1.5 rounded-lg text-[8px] font-bold transition ${active ? "bg-blue-500/15 text-blue-300" : "text-slate-600"}`}><Icon size={11} />{item.label}</button>; })}
      </nav>
      <section className="grid min-h-0 gap-2.5 xl:grid-cols-[.78fr_1.42fr_.9fr]">
        <div className={`min-h-0 ${activePanel === "projects" ? "block" : "hidden"} xl:block`}><ProjectsList projects={OPERATION_PROJECTS} selectedId={selectedProject.id} onSelect={project => { setSelectedProject(project); setActivePanel("summary"); }} /></div>
        <div className={`min-h-0 ${activePanel === "map" ? "block" : "hidden"} xl:block`}><OperationMapCard projects={OPERATION_PROJECTS} selectedId={selectedProject.id} onSelect={project => { setSelectedProject(project); setActivePanel("summary"); }} /></div>
        <div className={`min-h-0 ${activePanel === "summary" ? "block" : "hidden"} xl:block`}><ProjectSummary project={selectedProject} /></div>
      </section>
      <DailyOperationCard metrics={DAILY_OPERATION_METRICS} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { FolderKanban, Map, PanelRight } from "lucide-react";
import type { AppUser } from "@/types/auth";
import { OperationMapCard } from "./components/OperationMapCard";
import { OperationsHeader } from "./components/OperationsHeader";
import { OperationsKPIs } from "./components/OperationsKPIs";
import { ProjectsList } from "./components/ProjectsList";
import { ProjectSummary } from "./components/ProjectSummary";
import { ChiefConsole } from "./chief/ChiefConsole";
import { OperationsProvider } from "./hooks/OperationsProvider";
import { useOperationsReadModel } from "./hooks/useOperationsReadModel";

function OperationsContent({ user }: { user: AppUser }) {
  const readModel = useOperationsReadModel();
  const [view, setView] = useState<"ceo" | "chief">(user.role === "CHIEF" ? "chief" : "ceo");
  const [selectedProjectId, setSelectedProjectId] = useState(readModel.projects[0].id);
  const [activePanel, setActivePanel] = useState<"projects" | "map" | "summary">("map");
  const selectedProject = readModel.projects.find(project => project.id === selectedProjectId) ?? readModel.projects[0];

  if (view === "chief") return <ChiefConsole onExit={user.role === "CHIEF" ? undefined : () => setView("ceo")} />;

  return (
    <div className="operations-dashboard grid h-full min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-1.5 xl:grid-rows-[auto_auto_minmax(0,1fr)] xl:gap-2.5">
      <OperationsHeader onOpenChief={() => setView("chief")} />
      <OperationsKPIs items={readModel.kpis} />
      <nav aria-label="Operations panel seçimi" className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.06] bg-black/10 p-1 xl:hidden">
        {([{ id: "projects", label: "Projeler", icon: FolderKanban }, { id: "map", label: "Harita", icon: Map }, { id: "summary", label: "Proje Özeti", icon: PanelRight }] as const).map(item => { const Icon = item.icon; const active = activePanel === item.id; return <button key={item.id} type="button" onClick={() => setActivePanel(item.id)} className={`flex h-7 items-center justify-center gap-1.5 rounded-lg text-[8px] font-bold transition ${active ? "bg-blue-500/15 text-blue-300" : "text-slate-600"}`}><Icon size={11} />{item.label}</button>; })}
      </nav>
      <section className="grid min-h-0 gap-2.5 xl:grid-cols-[.78fr_1.42fr_.9fr]">
        <div className={`h-full min-h-0 overflow-hidden ${activePanel === "projects" ? "block" : "hidden"} xl:block`}><ProjectsList projects={readModel.projects} selectedId={selectedProject.id} onSelect={project => { setSelectedProjectId(project.id); setActivePanel("summary"); }} /></div>
        <div className={`h-full min-h-0 overflow-hidden ${activePanel === "map" ? "block" : "hidden"} xl:block`}><OperationMapCard projects={readModel.projects} selectedId={selectedProject.id} onSelect={project => { setSelectedProjectId(project.id); setActivePanel("summary"); }} /></div>
        <div className={`h-full min-h-0 overflow-hidden ${activePanel === "summary" ? "block" : "hidden"} xl:block`}><ProjectSummary project={selectedProject} /></div>
      </section>
    </div>
  );
}

export function OperationsModule({ user }: { user: AppUser }) {
  return <OperationsProvider><OperationsContent user={user} /></OperationsProvider>;
}

import type { ChiefAccount } from "../domain/chief-account";
import type { OperationProject } from "../domain/operation-project";
import type { WorkflowState } from "../workflow/workflow.types";

export type ChiefModuleId = "personnel" | "deka" | "team" | "problem";
export type ChiefTone = "active" | "complete" | "warning" | "critical" | "passive";

export type ChiefModuleViewModel = {
  id: ChiefModuleId;
  title: string;
  tone: ChiefTone;
  metrics: readonly [string, string, string];
};

export type ChiefExperienceViewModel = {
  identity: { platformLabel: string; displayName: string; personnelCode: string };
  operation: { code: string; projectName: string; progress: number; phaseLabel: string };
  currentAction: string;
  modules: readonly ChiefModuleViewModel[];
  motivation: { leaderCode: string; leaderProgress: number; chiefCode: string; chiefProgress: number };
};

const CURRENT_ACTIONS: Record<WorkflowState["currentStep"], string> = {
  project: "DEKA BAŞLAT",
  deka: "DK DOĞRULA",
  personnel: "PERSONEL QR",
  target: "BİNA SEÇ",
  photo: "SON FOTOĞRAF",
  delivery: "TESLİM",
  completed: "OPERASYON TAMAMLANDI"
};

export function buildChiefExperienceViewModel(chief: ChiefAccount, project: OperationProject, workflow: WorkflowState): ChiefExperienceViewModel {
  const activePersonnel = workflow.activePersonnelCount || project.activePersonnelCount;
  const totalPersonnel = Math.max(activePersonnel + 1, 6);
  const dekaReady = workflow.currentStep !== "personnel";

  return {
    identity: { platformLabel: "AL METHER CHIEF", displayName: chief.displayName, personnelCode: chief.personnelCode },
    operation: {
      code: project.code,
      projectName: project.name,
      progress: project.progress,
      phaseLabel: `${project.workflowState.toLocaleUpperCase("tr-TR")} AŞAMASI`
    },
    currentAction: CURRENT_ACTIONS[workflow.currentStep],
    modules: [
      {
        id: "personnel",
        title: "Personel",
        tone: workflow.completedSteps.includes("personnel") ? "complete" : "active",
        metrics: [`${activePersonnel} / ${totalPersonnel} aktif`, `${totalPersonnel - activePersonnel} mola`, "QR hazır"]
      },
      {
        id: "deka",
        title: "DEKA",
        tone: workflow.completedSteps.includes("deka") ? "complete" : dekaReady ? "active" : "passive",
        metrics: [dekaReady ? "Hazır" : "Personel bekleniyor", "GPS OK", workflow.completedSteps.includes("deka") ? "Tamamlandı" : "Başlat"]
      },
      { id: "team", title: "Takım", tone: workflow.unreadMessageCount > 0 ? "warning" : "active", metrics: [`${workflow.unreadMessageCount} okunmamış`, "Son mesaj", "Ekip hazır"] },
      { id: "problem", title: "Problem", tone: workflow.criticalProblemCount > 0 ? "critical" : "active", metrics: [`${workflow.criticalProblemCount} kritik`, `${workflow.supportCount} açık`, "Yeni problem"] }
    ],
    motivation: { leaderCode: "MTHR002", leaderProgress: 81, chiefCode: chief.personnelCode, chiefProgress: project.progress }
  };
}

import type { ChiefAccount } from "../domain/chief-account";
import type { OperationProject } from "../domain/operation-project";

export function findChiefProject(chief: ChiefAccount, projects: readonly OperationProject[]) {
  return projects.find(project => chief.assignedProjectCodes.includes(project.code)) ?? projects[0];
}

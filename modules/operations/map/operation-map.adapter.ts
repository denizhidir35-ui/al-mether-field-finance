import type { MapMarker } from "@/core/map/types";
import type { OperationProject } from "../domain/operation-project";

export function toOperationMapMarkers(projects: readonly OperationProject[], selectedId: string): readonly MapMarker[] {
  return projects.map(project => ({
    id: project.id,
    position: project.coordinates,
    label: project.code,
    title: `${project.code} ${project.name}`,
    active: project.id === selectedId,
    tone: project.markerStatus === "completed" ? "success" : project.markerStatus === "attention" ? "warning" : project.markerStatus === "active" ? "active" : "default"
  }));
}

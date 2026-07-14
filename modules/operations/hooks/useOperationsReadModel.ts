"use client";

import { useOperationsContext } from "./OperationsProvider";

export function useOperationsReadModel() {
  return useOperationsContext().readModel;
}

import type { OperationEvent } from "../workflow/workflow.events";

export interface OperationSyncService {
  enqueue(event: OperationEvent): Promise<void>;
  flush(): Promise<void>;
}

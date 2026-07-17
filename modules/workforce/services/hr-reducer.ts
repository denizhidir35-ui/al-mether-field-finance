import type { HrFoundationSnapshot } from "../domain/hr-foundation";

export type HrProjectionEnvelope = {
  data: HrFoundationSnapshot;
  meta: { lastSequence: number; lastEventType: string; aggregateRevisions: Record<string, number> };
};

export type HrProjectionEvent = { sequence: number; eventType: string; aggregateType: string; aggregateId: string };

export function reduceHrProjection(previous: HrProjectionEnvelope | null, event: HrProjectionEvent, data: HrFoundationSnapshot): HrProjectionEnvelope {
  const aggregateKey = `${event.aggregateType}:${event.aggregateId}`;
  return {
    data,
    meta: {
      lastSequence: event.sequence,
      lastEventType: event.eventType,
      aggregateRevisions: { ...(previous?.meta.aggregateRevisions ?? {}), [aggregateKey]: (previous?.meta.aggregateRevisions[aggregateKey] ?? 0) + 1 },
    },
  };
}

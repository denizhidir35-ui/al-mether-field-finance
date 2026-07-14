# AL METHER Operation Engine Golden Rule

**Status:** Accepted
**Authority:** AL METHER CORE
**Change policy:** Immutable without an explicit architecture decision approved by platform ownership.

## Mandatory entry question

Before any feature work starts, the owner and implementer must answer:

> Bu özellik Operation Engine'e nasıl bağlanacak?

Development must not start until the answer identifies all of the following:

1. the originating actor or system;
2. the `WorkOrder` affected by the action;
3. the domain event produced;
4. the repository boundary that persists the event;
5. the reducer transition;
6. the read-model fields produced;
7. every consumer that reads those fields.

## Only allowed communication path

```text
Actor / Module
  -> Command
  -> Operation Repository
  -> Domain Event
  -> Workflow Reducer
  -> Operation Read Model
  -> CEO / Chief / Map / Finance / Reports / Notifications / AI
```

- No screen updates another screen.
- No module updates another module.
- UI components never calculate business state.
- Consumers read projections; they do not own operational truth.
- Reducers are the single business-calculation boundary.
- The Operation Read Model is the single presentation source.
- Every operation requires a unique `WorkOrder`.
- Chief can act only on an assigned active `WorkOrder` and can only emit events.

## Canonical Chief event vocabulary

- `PERSONNEL_QR_START`
- `PERSONNEL_QR_FINISH`
- `DEKA_STARTED`
- `PHOTO_CAPTURED`
- `LOCATION_CAPTURED`
- `TARGET_SELECTED`
- `CHECKPOINT_CONFIRMED`
- `PROBLEM_REPORTED`
- `CHAT_MESSAGE`
- `DELIVERY_CONFIRMED`
- `WORKFLOW_COMPLETED`

Event names describe completed domain facts. Presentation labels, button names and module names must not become event types.

## Reducer and projection ownership

Only the Operation Engine may derive:

- progress and operational status;
- KPIs and completed-target totals;
- map markers and map state;
- personnel state;
- problem state;
- estimated completion;
- notifications and downstream integration signals.

Local component state is allowed only for presentation concerns such as an open panel, current tab, focus, animation or selected read-model item. It must never represent domain progress or mutate operational truth.

## WorkOrder invariant

No operation can start without a `WorkOrder`. A work order owns the references required by the workflow, including project, operation type, chief, personnel, workflow, targets, schedule, priority and evidence references.

Chief, CEO, Manager and future clients submit commands or events against that identifier. They never write another client's state.

## Integration checklist

Every Operations pull request must document:

- command and actor;
- `workOrderId`;
- emitted event type and version;
- reducer case;
- read-model change;
- affected projection consumers;
- idempotency and offline/replay behavior;
- tests proving the same event stream produces the same projection.

If any item is unknown, implementation is blocked.

## Current foundation audit

The repository already has the correct basic direction:

- repository abstraction and in-memory adapter;
- immutable operation events;
- reducer-based workflow state;
- centralized Operations read-model projection;
- CEO and Chief consumers reading the same provider projection.

The following gaps must be resolved before adding another Operations feature:

1. `WorkOrder` must become the root operation aggregate and every action must require a valid work order.
2. Generic `STEP_STARTED` / `STEP_COMPLETED` events must be migrated to the canonical domain vocabulary where a specific domain fact exists.
3. Chat and problem actions must emit `CHAT_MESSAGE` and `PROBLEM_REPORTED`; they must not be encoded as generic step events.
4. Reducer output must explicitly project personnel state, problem state, notifications and map state rather than leaving business derivation to consumers.
5. Replay and idempotency tests must protect deterministic projections before realtime, offline or Supabase adapters are added.

Until these gaps are closed by an Operation Engine Foundation sprint, new Operations features remain architecturally blocked.

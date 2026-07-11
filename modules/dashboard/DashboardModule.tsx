import type { AppUser } from "@/types/auth";
import type { ModuleId } from "@/core/navigation/navigation.types";
import { FIELD_TASKS, FIELD_TEAMS } from "./dashboard.data";
import { DailyTasksWidget } from "./components/DailyTasksWidget";
import { DashboardHeader } from "./components/DashboardHeader";
import { FieldTeamsWidget } from "./components/FieldTeamsWidget";
import { MailInboxWidget } from "./components/MailInboxWidget";
import { WorkProgressWidget } from "./components/WorkProgressWidget";

type DashboardModuleProps = { user: AppUser; onNavigate: (module: ModuleId) => void };

export function DashboardModule({ user, onNavigate }: DashboardModuleProps) {
  return (
    <div className="space-y-2.5">
      <DashboardHeader firstName={user.name.split(" ")[0]} />
      <section className="grid min-h-0 gap-2.5 xl:grid-cols-[1.3fr_.7fr]">
        <MailInboxWidget user={user} />
        <WorkProgressWidget tasks={FIELD_TASKS} onNavigate={onNavigate} />
      </section>
      <section className="grid gap-2.5 xl:grid-cols-[1fr_1fr]">
        <FieldTeamsWidget teams={FIELD_TEAMS} onNavigate={onNavigate} />
        <DailyTasksWidget tasks={FIELD_TASKS} onNavigate={onNavigate} />
      </section>
    </div>
  );
}

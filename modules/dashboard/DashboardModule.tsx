import type { AppUser } from "@/types/auth";
import type { ModuleId } from "@/core/navigation/navigation.types";
import { CALENDAR_EVENTS, CEO_NOTIFICATIONS, FIELD_TASKS, FIELD_TEAMS, UPCOMING_PAYMENTS } from "./dashboard.data";
import { CalendarWidget } from "./components/CalendarWidget";
import { CeoNotificationsWidget } from "./components/CeoNotificationsWidget";
import { DailyTasksWidget } from "./components/DailyTasksWidget";
import { DashboardHeader } from "./components/DashboardHeader";
import { MailInboxWidget } from "./components/MailInboxWidget";
import { UpcomingPaymentsWidget } from "./components/UpcomingPaymentsWidget";
import { WorkProgressWidget } from "./components/WorkProgressWidget";

type DashboardModuleProps = { user: AppUser; onNavigate: (module: ModuleId) => void };

export function DashboardModule({ user, onNavigate }: DashboardModuleProps) {
  return (
    <div className="space-y-3">
      <DashboardHeader firstName={user.name.split(" ")[0]} />
      <section className="grid min-h-0 gap-2.5 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,.75fr)]">
        <MailInboxWidget user={user} />
        <WorkProgressWidget tasks={FIELD_TASKS} teams={FIELD_TEAMS} onNavigate={onNavigate} />
      </section>
      <section className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-4">
        <DailyTasksWidget tasks={FIELD_TASKS} onNavigate={onNavigate} />
        <UpcomingPaymentsWidget payments={UPCOMING_PAYMENTS} onNavigate={onNavigate} />
        <CalendarWidget events={CALENDAR_EVENTS} />
        <CeoNotificationsWidget notifications={CEO_NOTIFICATIONS} />
      </section>
    </div>
  );
}

export type FieldTask = {
  title: string;
  location: string;
  team: string;
  status: string;
  progress: number;
  dueTime: string;
};

export type FieldTeam = {
  name: string;
  lead: string;
  people: number;
  activeJobs: number;
  status: string;
};

export type UpcomingPayment = {
  id: string;
  title: string;
  category: string;
  amount: number;
  dueLabel: string;
  urgency: "today" | "soon" | "normal";
};

export type CalendarEvent = {
  id: string;
  day: string;
  month: string;
  time: string;
  title: string;
  context: string;
};

export type CeoNotification = {
  id: string;
  title: string;
  detail: string;
  tone: "amber" | "blue" | "emerald";
};

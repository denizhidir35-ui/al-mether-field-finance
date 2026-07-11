export type DashboardMail = {
  id: number;
  sender: string;
  email: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  attachment: boolean;
};

export type FieldTask = {
  title: string;
  location: string;
  team: string;
  status: string;
  progress: number;
};

export type FieldTeam = {
  name: string;
  lead: string;
  people: number;
  activeJobs: number;
  status: string;
};


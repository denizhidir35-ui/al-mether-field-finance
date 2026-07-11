import type { CalendarEvent, CeoNotification, FieldTask, FieldTeam, UpcomingPayment } from "./types";

export const FIELD_TASKS: readonly FieldTask[] = [
  { title: "M085 bina giriş çalışması", location: "Karşıyaka", team: "Ekip Alpha", status: "Devam ediyor", progress: 72, dueTime: "14:30" },
  { title: "M086 fiber keşif", location: "Bornova", team: "Ekip Beta", status: "Saha kontrolü", progress: 46, dueTime: "16:00" },
  { title: "M101 teslim ve fotoğraf", location: "Gaziemir", team: "Ekip Gamma", status: "Teslime hazır", progress: 91, dueTime: "17:30" },
];

export const FIELD_TEAMS: readonly FieldTeam[] = [
  { name: "Ekip Alpha", lead: "Ahmet Yılmaz", people: 6, activeJobs: 2, status: "Sahada" },
  { name: "Ekip Beta", lead: "Mehmet Kaya", people: 5, activeJobs: 1, status: "Sahada" },
  { name: "Ekip Gamma", lead: "Serkan Demir", people: 4, activeJobs: 1, status: "Teslim" },
];

export const UPCOMING_PAYMENTS: readonly UpcomingPayment[] = [
  { id: "payment-1", title: "Atlas Kablo", category: "Tedarikçi", amount: 184_500, dueLabel: "Bugün", urgency: "today" },
  { id: "payment-2", title: "Araç yakıt kartları", category: "Filo", amount: 62_840, dueLabel: "Yarın", urgency: "soon" },
  { id: "payment-3", title: "Saha ekip bordrosu", category: "Personel", amount: 428_000, dueLabel: "15 Tem", urgency: "normal" },
];

export const CALENDAR_EVENTS: readonly CalendarEvent[] = [
  { id: "event-1", day: "12", month: "TEM", time: "11:00", title: "Operasyon değerlendirme", context: "Merkez ofis" },
  { id: "event-2", day: "13", month: "TEM", time: "09:30", title: "M101 saha teslimi", context: "Gaziemir" },
  { id: "event-3", day: "15", month: "TEM", time: "14:00", title: "Hakediş kontrolü", context: "Online" },
];

export const CEO_NOTIFICATIONS: readonly CeoNotification[] = [
  { id: "notice-1", title: "2 onay bekliyor", detail: "Satın alma ve personel talebi", tone: "amber" },
  { id: "notice-2", title: "M101 teslime hazır", detail: "Saha fotoğrafları tamamlandı", tone: "emerald" },
  { id: "notice-3", title: "Haftalık rapor hazır", detail: "Operasyon özeti oluşturuldu", tone: "blue" },
];

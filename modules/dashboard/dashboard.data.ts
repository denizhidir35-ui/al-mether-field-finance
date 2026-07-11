import type { DashboardMail, FieldTask, FieldTeam } from "./types";

export const DASHBOARD_MAILS: readonly DashboardMail[] = [
  { id: 1, sender: "Muhasebe", email: "muhasebe@almether.com", subject: "Temmuz ayı ödeme planı hazırlandı", preview: "Onaylanması gereken ödeme kalemleri ve belgeler ektedir.", time: "10:40", unread: true, attachment: true },
  { id: 2, sender: "Aytaç Türkbay", email: "aytacturkbay@almether.com", subject: "M085 saha ekibi günlük durum raporu", preview: "Gün sonu çalışmaları, ekip durumu ve kalan işler tamamlandı.", time: "09:18", unread: true, attachment: false },
  { id: 3, sender: "Proje Ekibi", email: "proje@almether.com", subject: "Yeni fiber keşif dosyası", preview: "Saha keşfi, fotoğraflar ve uygulama planı hazırlandı.", time: "Dün", unread: false, attachment: true },
  { id: 4, sender: "İnsan Kaynakları", email: "hr@almether.com", subject: "Yeni personel evrak kontrolü", preview: "Salı günü başlayacak personellerin eksik belgeleri listelendi.", time: "Dün", unread: false, attachment: false }
];

export const FIELD_TASKS: readonly FieldTask[] = [
  { title: "M085 bina giriş çalışması", location: "Karşıyaka", team: "Ekip Alpha", status: "Devam ediyor", progress: 72 },
  { title: "M086 fiber keşif", location: "Bornova", team: "Ekip Beta", status: "Saha kontrolü", progress: 46 },
  { title: "M101 teslim ve fotoğraf", location: "Gaziemir", team: "Ekip Gamma", status: "Teslime hazır", progress: 91 }
];

export const FIELD_TEAMS: readonly FieldTeam[] = [
  { name: "Ekip Alpha", lead: "Ahmet Yılmaz", people: 6, activeJobs: 2, status: "Sahada" },
  { name: "Ekip Beta", lead: "Mehmet Kaya", people: 5, activeJobs: 1, status: "Sahada" },
  { name: "Ekip Gamma", lead: "Serkan Demir", people: 4, activeJobs: 1, status: "Teslim" }
];


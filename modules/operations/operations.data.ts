import type { DailyOperationMetric, OperationProject, OperationsKPI } from "./types";

export const OPERATION_PROJECTS: readonly OperationProject[] = [
  {
    id: "izmir-karsiyaka-085",
    name: "M085 Karşıyaka Fiber Dönüşüm",
    city: "İzmir",
    district: "Karşıyaka",
    island: "M085",
    status: "Sahada",
    progress: 72,
    supervisor: "Ahmet Yılmaz",
    streets: 18,
    distributionBoxes: 46,
    buildings: 284,
    startDate: "01 Tem 2026",
    estimatedEndDate: "28 Tem 2026",
    coordinates: { x: 35, y: 42 }
  },
  {
    id: "izmir-bornova-086",
    name: "M086 Bornova Altyapı Operasyonu",
    city: "İzmir",
    district: "Bornova",
    island: "M086",
    status: "Sahada",
    progress: 46,
    supervisor: "Mehmet Kaya",
    streets: 12,
    distributionBoxes: 31,
    buildings: 196,
    startDate: "06 Tem 2026",
    estimatedEndDate: "04 Ağu 2026",
    coordinates: { x: 62, y: 34 }
  },
  {
    id: "izmir-gaziemir-101",
    name: "M101 Gaziemir Saha Teslimi",
    city: "İzmir",
    district: "Gaziemir",
    island: "M101",
    status: "Teslim",
    progress: 91,
    supervisor: "Serkan Demir",
    streets: 9,
    distributionBoxes: 24,
    buildings: 148,
    startDate: "18 Haz 2026",
    estimatedEndDate: "15 Tem 2026",
    coordinates: { x: 51, y: 68 }
  }
] as const;

export const OPERATIONS_KPIS: readonly OperationsKPI[] = [
  { label: "Aktif Proje", mobileLabel: "Projeler", value: "3", detail: "2 sahada, 1 teslimde" },
  { label: "Aktif Şef", mobileLabel: "Şefler", value: "3", detail: "Tümü çevrimiçi" },
  { label: "Aktif Personel", mobileLabel: "Personel", value: "15", detail: "12 personel sahada" },
  { label: "Bugün Tamamlanan Bina", mobileLabel: "Bina / Bugün", value: "24", detail: "+6 son iki saatte" },
  { label: "Devam Eden Operasyon", mobileLabel: "Operasyon", value: "8", detail: "3 kritik iş akışı" },
  { label: "Toplam Sokak", mobileLabel: "Sokaklar", value: "39", detail: "21 sokak tamamlandı" }
] as const;

export const DAILY_OPERATION_METRICS: readonly DailyOperationMetric[] = [
  { label: "Tamamlanan Binalar", mobileLabel: "Bina", value: "24" },
  { label: "Devam Edenler", mobileLabel: "Devam", value: "11" },
  { label: "Bekleyenler", mobileLabel: "Bekleyen", value: "7" },
  { label: "Toplam Fotoğraf", mobileLabel: "Fotoğraf", value: "186" },
  { label: "Tamamlanan Sokak", mobileLabel: "Sokak", value: "4" }
] as const;

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getKalenderAkademiks,
  createKalenderAkademik,
  deleteKalenderAkademik,
  getTahunAjarans
} from "@/lib/api/services/akademikService";
import { getLembagas } from "@/lib/api/services/masterService";
import { useAuthStore } from "@/store/useAuthStore";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { toast } from "sonner";

export const eventTypes = {
  Akademik: {
    color: "bg-amber-500",
    label: "Akademik",
    bgLight: "bg-amber-100",
    textLight: "text-amber-600",
    borderLight: "border-amber-200",
    hexLight: "#fef3c7",
  },
  Acara: {
    color: "bg-blue-500",
    label: "Acara",
    bgLight: "bg-blue-100",
    textLight: "text-blue-600",
    borderLight: "border-blue-200",
    hexLight: "#dbeafe",
  },
  Libur: {
    color: "bg-red-500",
    label: "Libur",
    bgLight: "bg-red-100",
    textLight: "text-red-600",
    borderLight: "border-red-200",
    hexLight: "#fee2e2",
  },
  Lainnya: {
    color: "bg-emerald-500",
    label: "Lainnya",
    bgLight: "bg-emerald-100",
    textLight: "text-emerald-600",
    borderLight: "border-emerald-200",
    hexLight: "#d1fae5",
  },
} as const;

export type EventTypeKey = keyof typeof eventTypes;

export type KalenderRow = {
  kalender_id: number;
  lembaga_id?: number | null;
  tahun_id: number;
  nama_kegiatan: string;
  kategori: EventTypeKey;
  tanggal_mulai: string;
  tanggal_berakhir: string;
  lembaga?: {
    singkatan?: string;
  };
};

export type CalendarEvent = KalenderRow & {
  date: Date;
  endDate: Date;
  type: EventTypeKey;
  typeText: EventTypeKey;
  extraText: string;
  isActivityPlan?: boolean;
};

const now = new Date();
const currentYear = now.getFullYear();
const currentMonthIndex = now.getMonth();

export const useKalender = () => {
  const queryClient = useQueryClient();
  const role = useAuthStore(state => state.role);

  // Realtime: auto-refresh saat ada perubahan kalender dari user lain
  useRealtimeSync([
    { table: 'kalender_akademik', queryKeys: [['akademik', 'kalender']] },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<EventTypeKey>("Akademik");
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    new Date(currentYear, currentMonthIndex, 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(now);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);

  // Filter state
  const [filterKategori, setFilterKategori] = useState<EventTypeKey | "Semua">("Semua");
  const [filterBulan, setFilterBulan] = useState<string>("Semua");

  const [formData, setFormData] = useState({
    nama_kegiatan: "",
    tanggal_mulai: "",
    tanggal_berakhir: "",
    lembaga_id: "null",
  });

  const { data: activeTahun = [] } = useQuery({
    queryKey: ['akademik', 'tahun-ajaran-aktif'],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      const res = await getTahunAjarans({ select: 'tahun_id,lembaga_id,is_active' });
      return res.filter(t => t.is_active === true);
    }
  });

  const { data: lembagaList = [] } = useQuery({
    queryKey: ['master-data', 'lembaga-options'],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: () => getLembagas({ select: 'lembaga_id,nama_lembaga,singkatan' }),
  });

  const { data: eventsData = [] } = useQuery({
    queryKey: ['akademik', 'kalender'],
    staleTime: 2 * 60 * 1000, // 2 menit (auto-invalidated via useRealtimeSync)
    queryFn: async () => {
      const response = await getKalenderAkademiks({
        select: "*,lembaga(singkatan)",
        order: "tanggal_mulai.asc",
      });

      return (response as unknown as KalenderRow[]).map((item) => ({
        ...item,
        date: new Date(item.tanggal_mulai),
        endDate: new Date(item.tanggal_berakhir || item.tanggal_mulai),
        nama_kegiatan: item.nama_kegiatan,
        type: item.kategori,
        typeText: item.kategori,
        extraText: item.lembaga?.singkatan || "",
        isActivityPlan: false,
      })) as CalendarEvent[];
    }
  });

  const createMutation = useMutation({
    mutationFn: createKalenderAkademik,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['akademik', 'kalender'] });
      setIsModalOpen(false);
      setFormData({ nama_kegiatan: "", tanggal_mulai: "", tanggal_berakhir: "", lembaga_id: "null" });
      toast.success("Berhasil menyimpan event kalender!");
    },
    onError: () => toast.error("Acara kalender gagal disimpan. Silakan coba lagi.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKalenderAkademik,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['akademik', 'kalender'] });
      toast.success("Event kalender berhasil dihapus!");
    },
    onError: () => toast.error("Acara kalender gagal dihapus. Silakan coba lagi.")
  });

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTahun.length === 0) {
      toast.error("Gagal: Tidak ada Tahun Ajaran yang aktif. Aktifkan tahun ajaran terlebih dahulu.");
      return;
    }

    if (!formData.tanggal_mulai) {
      toast.error("Tanggal Mulai wajib diisi.");
      return;
    }
    if (!formData.tanggal_berakhir) {
      toast.error("Tanggal Selesai wajib diisi.");
      return;
    }
    if (formData.tanggal_berakhir < formData.tanggal_mulai) {
      toast.error("Tanggal Selesai tidak boleh mendahului Tanggal Mulai.");
      return;
    }

    let selectedTahunId = activeTahun[0].tahun_id;
    if (formData.lembaga_id !== "null") {
      const lembagaIdInt = parseInt(formData.lembaga_id);
      const tahunForLembaga = activeTahun.find(t => t.lembaga_id === lembagaIdInt);
      if (!tahunForLembaga) {
        toast.error("Gagal: Lembaga yang dipilih tidak memiliki Tahun Ajaran yang aktif.");
        return;
      }
      selectedTahunId = tahunForLembaga.tahun_id;
    }

    createMutation.mutate({
      nama_kegiatan: formData.nama_kegiatan,
      kategori: selectedCategory,
      tanggal_mulai: formData.tanggal_mulai,
      tanggal_berakhir: formData.tanggal_berakhir,
      lembaga_id: formData.lembaga_id === "null" ? undefined : parseInt(formData.lembaga_id),
      tahun_id: selectedTahunId
    } as any);
  };

  const isDateInRange = (eventStartDate: Date, eventEndDate: Date, targetDate: Date) => {
    const start = new Date(eventStartDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(eventEndDate);
    end.setHours(23, 59, 59, 999);
    
    const target = new Date(targetDate);
    
    return target.getTime() >= start.getTime() && target.getTime() <= end.getTime();
  };

  const filteredEvents = useMemo(() => {
    return eventsData.filter((e) => {
      const matchKategori = filterKategori === "Semua" || e.type === filterKategori;
      const matchBulan = filterBulan === "Semua" || e.date.getMonth() === parseInt(filterBulan);
      return matchKategori && matchBulan;
    });
  }, [eventsData, filterKategori, filterBulan]);

  const getEventsForDate = (date: Date): string[] => {
    const dayEvents = filteredEvents.filter((e) => isDateInRange(e.date, e.endDate, date));
    const eventTypesSet = new Set(dayEvents.map((e) => e.type));
    if (date.getDay() === 5) {
      eventTypesSet.add("Libur");
    }
    return Array.from(eventTypesSet);
  };

  const getFullEventsForDate = (date: Date): CalendarEvent[] => {
    const dayEvents = filteredEvents.filter((e) => isDateInRange(e.date, e.endDate, date));
    if (date.getDay() === 5) {
      dayEvents.push({
        kalender_id: -date.getTime(),
        tahun_id: 0,
        nama_kegiatan: "Libur Jumat",
        kategori: "Libur",
        tanggal_mulai: date.toISOString(),
        tanggal_berakhir: date.toISOString(),
        date: date,
        endDate: date,
        type: "Libur",
        typeText: "Libur",
        extraText: "Mingguan",
        isActivityPlan: false,
      });
    }
    return dayEvents;
  };

  const handleConfirmHapus = () => {
    if (eventToDelete) {
      deleteMutation.mutate(eventToDelete.kalender_id);
    }
    setIsDeleteModalOpen(false);
    setEventToDelete(null);
  };

  return {
    role,
    selectedCategory,
    setSelectedCategory,
    currentMonthDate,
    setCurrentMonthDate,
    selectedDate,
    setSelectedDate,
    isModalOpen,
    setIsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    eventToDelete,
    setEventToDelete,
    filterKategori,
    setFilterKategori,
    filterBulan,
    setFilterBulan,
    formData,
    setFormData,
    lembagaList,
    createMutation,
    deleteMutation,
    handleSimpan,
    getEventsForDate,
    getFullEventsForDate,
    handleConfirmHapus,
    filteredEvents,
  };
};

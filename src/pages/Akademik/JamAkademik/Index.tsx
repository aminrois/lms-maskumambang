// src/pages/Akademik/JamAkademik/Index.tsx
import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/store/useAuthStore";
import { useJamAkademik } from "./hooks/useJamAkademik";
import { JamHeader } from "./components/JamHeader";
import { JamFilters } from "./components/JamFilters";
import { JamCard } from "./components/JamCard";
import { JamKhususCard } from "./components/JamKhususCard";
import { JamFormModal } from "./components/JamFormModal";
import { JamKhususFormModal } from "./components/JamKhususFormModal";
import { JamDeleteModal } from "./components/JamDeleteModal";
import { TerapkanModal } from "./components/TerapkanModal";
import { UnsavedWarningModal } from "./components/UnsavedWarningModal";
import { ScanKhususModal } from "./components/ScanKhususModal";
import type { JamKhususConfig } from "./hooks/useJamKhusus";

import { Card, CardContent } from "@/components/ui/card";
import { Inbox, Info, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";

const JamAkademikIndex: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePermissions('jam_akademik');
  const userLembagaId = useAuthStore(state => state.lembaga_id);

  const [isInfoOpen, setIsInfoOpen] = React.useState(false);

  const [jamMode, setJamMode] = React.useState<"Umum" | "Khusus">("Umum");
  const [isKhususModalOpen, setIsKhususModalOpen] = React.useState(false);
  const [selectedKhususData, setSelectedKhususData] = React.useState<JamKhususConfig | null>(null);
  const [khususFormData, setKhususFormData] = React.useState<Omit<JamKhususConfig, "id">>({
    lembaga_id: 0,
    hari: "Senin",
    urutan_jam: 1,
    tipe: "Apel"
  });

  const {
    activeTab,
    setActiveTab,
    isWakaKurikulum,
    isDirector,
    isModalOpen,
    setIsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isTerapkanModalOpen,
    setIsTerapkanModalOpen,
    isUnsavedWarningModalOpen,
    setIsUnsavedWarningModalOpen,
    handleConfirmLeave,
    handleTerapkanNowFromWarning,
    jamToDelete,
    selectedData,
    formData,
    setFormData,
    dataJam,
    isLoading,
    dataLembagaList,
    createMutation,
    updateMutation,
    deleteMutation,
    terapkanMutation,
    tabs,
    filteredData,
    hasJadwalChanges,
    terapkanInfo,
    terapkanProgressUmum,
    terapkanStatsUmum,
    terapkanProgressKhusus,
    terapkanStatsKhusus,
    terapkanTahap,
    handleOpenAddModal,
    handleEdit,
    handleSimpan,
    handleHapus,
    handleConfirmHapus,
    handleTerapkanKeJadwalKelas,
    handleConfirmTerapkan,
    jamKhusus,
    activeLocalDrafts
  } = useJamAkademik();

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Handlers for Jam Khusus
  const handleOpenAddKhususModal = () => {
    setSelectedKhususData(null);
    const targetLembagaId = isDirector && activeTab !== "Semua"
      ? (dataLembagaList.find((l: any) => l.singkatan === activeTab || l.nama_lembaga === activeTab)?.lembaga_id || 0)
      : userLembagaId || (dataLembagaList.length > 0 ? dataLembagaList[0].lembaga_id : 0);

    setKhususFormData({
      lembaga_id: targetLembagaId,
      hari: "Sabtu",
      urutan_jam: 1,
      tipe: "Apel"
    });
    setIsKhususModalOpen(true);
  };

  const handleEditKhusus = (jam: JamKhususConfig) => {
    setSelectedKhususData(jam);
    setKhususFormData(jam);
    setIsKhususModalOpen(true);
  };

  const handleSimpanKhusus = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKhususData) {
      if (jamKhusus.updateJamKhusus(selectedKhususData.id, khususFormData)) {
        setIsKhususModalOpen(false);
      }
    } else {
      if (jamKhusus.addJamKhusus(khususFormData)) {
        setIsKhususModalOpen(false);
      }
    }
  };

  const handleHapusKhusus = (id: string) => {
    // You could create a specific delete modal for khusus, but since it's local storage, 
    // we can just confirm it directly or use a simple window.confirm
    if (window.confirm("Apakah Anda yakin ingin menghapus jam khusus ini?")) {
      jamKhusus.deleteJamKhusus(id);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 bg-[#F4F7FE] min-h-dvh font-sans">
      {/* HEADER */}
      <JamHeader
        canCreate={canCreate}
        totalJam={jamMode === "Umum" ? dataJam.length : jamKhusus.currentLembagaData.length}
        onAddClick={jamMode === "Umum" ? handleOpenAddModal : handleOpenAddKhususModal}
        title={jamMode === "Umum" ? "Jam Akademik" : "Jam Khusus"}
        showTerapkanButton={hasJadwalChanges && canCreate}
        onTerapkanClick={handleTerapkanKeJadwalKelas}
        isTerapkanPending={terapkanMutation.isPending}
        showScanKhususButton={jamMode === "Khusus"}
        onScanKhususClick={() => jamKhusus.setIsScanModalOpen(true)}
      />

      {/* INFORMASI JAM AKADEMIK & JADWAL KELAS */}
      <Card className="rounded-2xl border border-indigo-100/80 shadow-2xs overflow-hidden bg-white">
        <button
          onClick={() => setIsInfoOpen(!isInfoOpen)}
          className="w-full px-5 py-3.5 flex justify-between items-center bg-linear-to-r from-indigo-50/60 to-blue-50/40 hover:from-indigo-50 hover:to-blue-50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-[#243B7A] font-bold text-sm">
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-2xs">
              <Info className="w-4 h-4" />
            </div>
            <span>Bagaimana Cara Kerja Jam Akademik & Jadwal Kelas?</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-600 font-semibold hidden sm:inline">
              {isInfoOpen ? "Sembunyikan Panduan" : "Lihat Panduan"}
            </span>
            {isInfoOpen ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />}
          </div>
        </button>

        {isInfoOpen && (
          <CardContent className="p-5 border-t border-indigo-100/60 bg-white text-xs text-slate-600 space-y-3 leading-relaxed">
            <p className="text-slate-600 text-[13px] leading-relaxed">
              Jam Akademik menentukan struktur waktu, durasi, dan jenis kegiatan (<strong>Belajar</strong>, <strong>Istirahat</strong>, <strong>Sholat Dhuha &amp; Halaqoh</strong>, <strong>Apel</strong>, <strong>Mapel Pilihan / Bimbingan TKA</strong>, atau <strong>Bonding / Life Skill</strong>) untuk seluruh kelas di lembaga ini.
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-[12.5px] space-y-2 leading-relaxed">
              <li>
                <strong>Kegunaan Tombol "Terapkan ke Jadwal Kelas"</strong>, digunakan untuk merilis dan menyinkronkan seluruh struktur slot waktu jam akademik ini secara otomatis ke seluruh kelas pada lembaga aktif, sehingga slot jadwal siap diisi mata pelajaran pada halaman Jadwal Pelajaran.
              </li>
              <li>
                <strong>Kapan Tombol Muncul</strong>, tombol ini hanya akan muncul secara otomatis apabila terdapat perubahan data jam akademik (tambah/edit/hapus) atau jika ada penambahan kelas baru yang belum tersinkronisasi.
              </li>
              <li>
                Sesi khusus seperti <strong>Istirahat</strong>, <strong>Sholat Dhuha &amp; Halaqoh</strong>, <strong>Apel</strong>, <strong>Mapel Pilihan / Bimbingan TKA</strong>, dan <strong>Bonding / Life Skill</strong> otomatis menjadi penanda jalur penuh tanpa perlu mengisi mata pelajaran atau guru.
              </li>
              <li>
                Pengisian mata pelajaran, guru pengampu, dan ruangan dilakukan pada halaman <strong>Akademik → Jadwal Pelajaran</strong>.
              </li>
            </ul>
          </CardContent>
        )}
      </Card>

      {/* MODE TOGGLE */}
      <div className="flex justify-center my-4">
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
          <button
            onClick={() => setJamMode("Umum")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${jamMode === "Umum"
              ? "bg-blue-900 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
          >
            Jam Umum
          </button>
          <button
            onClick={() => setJamMode("Khusus")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${jamMode === "Khusus"
              ? "bg-blue-900 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
          >
            Jam Khusus
          </button>
        </div>
      </div>

      {/* FILTER TABS — hanya untuk Direktur */}
      {isDirector && (
        <JamFilters
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* LIST OF PERIODS */}
      <div className="space-y-4">
        {jamMode === "Umum" ? (
          isLoading ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-150 shadow-sm">
              <span className="text-gray-400 font-medium text-sm">Memuat data jam akademik...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-150 shadow-sm">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">Tidak ada data</h3>
              <p className="text-gray-400 mt-1 text-sm">Belum ada jam akademik terdaftar untuk filter ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredData.map((jam) => (
                <JamCard
                  key={jam.id}
                  jam={jam}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onEdit={() => handleEdit(jam)}
                  onDelete={() => handleHapus(jam)}
                />
              ))}
            </div>
          )
        ) : (
          /* TAMPILAN JAM KHUSUS */
          jamKhusus.currentLembagaData.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-150 shadow-sm space-y-3">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-700">Tidak ada Jam Khusus</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Anda belum mengatur jam khusus untuk lembaga ini, atau klik tombol di bawah untuk memindai jam khusus dari jadwal kelas di database.
              </p>
              <button
                onClick={() => jamKhusus.setIsScanModalOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Pindai Jam Khusus dari Jadwal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {jamKhusus.currentLembagaData.map((jk) => (
                <JamKhususCard
                  key={jk.id}
                  jamKhusus={jk}
                  dataJamUmum={activeLocalDrafts}
                  namaLembaga={dataLembagaList.find((l: any) => l.lembaga_id === jk.lembaga_id)?.nama_lembaga || "Lembaga"}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onEdit={() => handleEditKhusus(jk)}
                  onDelete={() => handleHapusKhusus(jk.id)}
                />
              ))}
            </div>
          )
        )}
      </div>


      <JamFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedData={selectedData}
        formData={formData}
        setFormData={setFormData}
        dataLembagaList={dataLembagaList}
        isWakaKurikulum={isWakaKurikulum}
        onSubmit={handleSimpan}
        isPending={isPending}
      />

      <JamKhususFormModal
        open={isKhususModalOpen}
        onOpenChange={setIsKhususModalOpen}
        selectedData={selectedKhususData}
        formData={khususFormData}
        setFormData={setKhususFormData}
        dataLembagaList={dataLembagaList}
        isWakaKurikulum={isWakaKurikulum}
        onSubmit={handleSimpanKhusus}
        dataJamUmum={activeLocalDrafts}
      />

      {/* DELETE MODAL */}
      <JamDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        jamToDelete={jamToDelete}
        onConfirm={handleConfirmHapus}
        isPending={deleteMutation.isPending}
      />

      {/* TERAPKAN KE JADWAL KELAS MODAL */}
      <TerapkanModal
        open={isTerapkanModalOpen}
        onOpenChange={setIsTerapkanModalOpen}
        terapkanInfo={terapkanInfo}
        onConfirm={handleConfirmTerapkan}
        isPending={terapkanMutation.isPending}
        terapkanProgress={terapkanTahap === 1 ? terapkanProgressUmum : terapkanProgressKhusus}
        terapkanStats={terapkanTahap === 1 ? terapkanStatsUmum : terapkanStatsKhusus}
        terapkanTahap={terapkanTahap}
      />

      {/* WARNING MODAL UNTUK DRAFT BELUM TERSIMPAN SAAAT NAVIGASI */}
      <UnsavedWarningModal
        open={isUnsavedWarningModalOpen}
        onOpenChange={setIsUnsavedWarningModalOpen}
        onConfirmLeave={handleConfirmLeave}
        onTerapkanNow={handleTerapkanNowFromWarning}
      />

      {/* MODAL PEMINDAIAN JAM KHUSUS BERDERSARKAN OVERRIDE RUANGAN JADWAL KELAS */}
      <ScanKhususModal
        open={jamKhusus.isScanModalOpen}
        onOpenChange={jamKhusus.setIsScanModalOpen}
        isScanning={jamKhusus.isScanning}
        progress={jamKhusus.scanProgress}
        stats={jamKhusus.scanStats}
        isCompleted={jamKhusus.isScanCompleted}
        foundItems={jamKhusus.scanFoundItems}
        dataLembagaList={dataLembagaList}
        onStartScan={jamKhusus.startScanFromDatabase}
      />
    </div>
  );
};

export default JamAkademikIndex;

//src/pages/Akademik/Kalender/Index.tsx
import React from "react";
import { Kalendar } from "@/components/custom/Kalendar";
import { usePermissions } from "@/hooks/usePermissions";
import { useKalender, eventTypes } from "./hooks/useKalender";
import { KalenderHeader } from "./components/KalenderHeader";
import { KalenderCreateModal } from "./components/KalenderCreateModal";
import { KalenderDeleteModal } from "./components/KalenderDeleteModal";
import { KalenderSidebar } from "./components/KalenderSidebar";

const KalenderAkademikIndex: React.FC = () => {
  const { canCreate, canDelete } = usePermissions('kalender_akademik');

  const {
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
  } = useKalender();

  return (
    <div className="w-full bg-[#F4F7FE] min-h-[calc(100vh-64px)] p-4 md:p-6 font-sans">
      {/* Header Area */}
      <KalenderHeader
        canCreate={canCreate}
        onAddClick={() => setIsModalOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mt-4">
        {/* Calendar Grid Component */}
        <Kalendar
          eventTypes={eventTypes}
          getEventsForDate={getEventsForDate}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          currentMonth={currentMonthDate}
          onMonthChange={setCurrentMonthDate}
        />

        {/* Right Sidebar Details & Event Mendatang Card */}
        <KalenderSidebar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          setCurrentMonthDate={setCurrentMonthDate}
          getFullEventsForDate={getFullEventsForDate}
          filteredEvents={filteredEvents}
          canDelete={canDelete}
          deletePending={deleteMutation.isPending}
          onDeleteClick={(evt) => {
            setEventToDelete(evt);
            setIsDeleteModalOpen(true);
          }}
          filterKategori={filterKategori}
          setFilterKategori={setFilterKategori}
          filterBulan={filterBulan}
          setFilterBulan={setFilterBulan}
        />
      </div>

      {/* CREATE MODAL */}
      <KalenderCreateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        formData={formData}
        setFormData={setFormData}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        lembagaList={lembagaList}
        onSubmit={handleSimpan}
        isPending={createMutation.isPending}
      />

      {/* DELETE CONFIRM MODAL */}
      <KalenderDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        eventToDelete={eventToDelete}
        onConfirm={handleConfirmHapus}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

export default KalenderAkademikIndex;

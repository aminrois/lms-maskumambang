import { useActivityPlan } from "./hooks/useActivityPlan";
import { ActivityPlanHeader } from "./components/ActivityPlanHeader";
import { ActivityPlanFilters } from "./components/ActivityPlanFilters";
import { ActivityPlanList } from "./components/ActivityPlanList";
import { ActivityPlanDialog } from "./components/ActivityPlanDialog";
import { ActivityPlanDeleteModal } from "./components/ActivityPlanDeleteModal";
import { ActivityPlanVerifyModals } from "./components/ActivityPlanVerifyModals";

export default function ActivityPlanIndex() {
  const {
    canCreate,
    canUpdate,
    canDelete,
    canVerify,
    activeTab,
    setActiveTab,
    isOpen,
    setIsOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    isApproveModalOpen,
    setIsApproveModalOpen,
    isRevisiModalOpen,
    setIsRevisiModalOpen,
    selectedPlan,
    revisiNote,
    setRevisiNote,
    formData,
    setFormData,
    isLembagaDisabled,
    lembagas,
    filteredTahuns,
    kalenderEvents,
    isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    verifyMutation,
    adakanMutation,
    handleAdakan,
    handleOpenAdd,
    handleOpenEdit,
    handleOpenDelete,
    handleVerifyAction,
    executeVerify,
    handleSubmit,
    handleDelete,
    filteredActivity,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useActivityPlan();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      <ActivityPlanHeader 
        canCreate={canCreate} 
        onOpenAdd={handleOpenAdd} 
      />

      <ActivityPlanFilters 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <ActivityPlanList
        isLoading={isLoading}
        filteredActivity={filteredActivity}
        kalenderEvents={kalenderEvents}
        canVerify={canVerify}
        canUpdate={canUpdate}
        canDelete={canDelete}
        isAdakanPending={adakanMutation.isPending}
        onAdakan={handleAdakan}
        onVerifyAction={handleVerifyAction}
        onOpenEdit={handleOpenEdit}
        onOpenDelete={handleOpenDelete}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      <ActivityPlanDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        selectedPlan={selectedPlan}
        formData={formData}
        setFormData={setFormData}
        isLembagaDisabled={isLembagaDisabled}
        lembagas={lembagas}
        filteredTahuns={filteredTahuns}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <ActivityPlanDeleteModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        selectedPlan={selectedPlan}
        isPending={deleteMutation.isPending}
        onDelete={handleDelete}
      />

      <ActivityPlanVerifyModals
        isApproveOpen={isApproveModalOpen}
        onApproveOpenChange={setIsApproveModalOpen}
        isRevisiOpen={isRevisiModalOpen}
        onRevisiOpenChange={setIsRevisiModalOpen}
        selectedPlan={selectedPlan}
        revisiNote={revisiNote}
        setRevisiNote={setRevisiNote}
        isPending={verifyMutation.isPending}
        onVerify={executeVerify}
      />
    </div>
  );
}
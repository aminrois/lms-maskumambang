import React, { useState, useMemo, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut, ChevronLeft, KeyRound, Loader2, ShieldOff, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useMenuTrackerStore } from "../store/useMenuTrackerStore";
import { useNavigationStore } from "../store/useNavigationStore";
import { allMenuGroups } from "../config/menuConfig";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient, useIsFetching } from "@tanstack/react-query";
import { changePassword, logout as authServiceLogout } from "@/lib/api/services/authService";
import { getPegawaiByUserId, getLembagas } from "@/lib/api/services/masterService";
import { toast } from "sonner";
import StaticIslamicPattern from "@/components/ui/StaticIslamicPattern";
import { useFeatureRealtimeSync } from "@/hooks/useRealtimeSync";
import { ProtectedCopyright } from "@/components/ProtectedCopyright";
import ErrorBoundary from "@/components/ui/ErrorBoundary";


const MainLayout: React.FC = () => {
  useFeatureRealtimeSync("MAIN_LAYOUT");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const { blockingFn, setPendingPath } = useNavigationStore();

  React.useEffect(() => {
    if (location.pathname && location.pathname !== '/dashboard') {
      useMenuTrackerStore.getState().trackVisit(location.pathname);
    }
  }, [location.pathname]);

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    setIsMobileOpen(false);
    if (blockingFn && blockingFn()) {
      e.preventDefault();
      setPendingPath(path);
    }
  };

  const user = useAuthStore(state => state.user);
  const userRoles = useAuthStore(state => state.roles);
  const userRole = useAuthStore(state => state.role);
  const userLembaga = useAuthStore(state => state.lembaga_id);
  const setActiveRole = useAuthStore(state => state.setActiveRole);
  const logout = useAuthStore(state => state.logout);

  // Fetch lembagas to resolve lembaga_name robustly
  // Gunakan key berbeda dari useLembagaData agar tidak konflik dengan cache halaman Lembaga
  const { data: lembagas = [] } = useQuery({
    queryKey: ['mainlayout', 'lembaga-list'],
    queryFn: () => getLembagas({ select: 'lembaga_id,nama_lembaga,singkatan' }),
    staleTime: 5 * 60 * 1000, // 5 menit — data lembaga jarang berubah, cukup cache lebih lama
  });

  // Fetch full name from pegawai table using user_id
  const { data: pegawaiData } = useQuery({
    queryKey: ['mainlayout', 'pegawai-profile', user?.user_id],
    queryFn: async () => {
      const data = await getPegawaiByUserId(user!.user_id);
      return data || null;
    },
    enabled: !!user?.user_id,
    staleTime: 5 * 60 * 1000,
  });

  const displayName = pegawaiData?.nama || user?.username || 'Pengguna';
  const displayInitial = displayName.charAt(0).toUpperCase();

  const isSuperAdmin = userRoles.some(r => r.role === 'Super Admin') || user?.username === 'admin';
  const isGlobalRole = isSuperAdmin || userRole === 'Direktur';

  const availableRoles = isSuperAdmin
    ? [
        'Super Admin',
        'Direktur',
        'Kepala Sekolah',
        'Admin Lembaga',
        'WaKa Kurikulum',
        'Wali Kelas',
        'Guru',
      ]
    : (userRoles.length > 0 ? Array.from(new Set(userRoles.map(r => r.role))) : [userRole || 'Super Admin']);

  const hasRole = Boolean((userRoles.length > 0 && userRole) || isSuperAdmin || userRole);

  // Lembagas specifically assigned to this user / role
  const allowedLembagas = useMemo(() => {
    const allLembagas = Array.isArray(lembagas) ? lembagas : [];
    if (allLembagas.length === 0) return [];
    if (isGlobalRole) return allLembagas;

    // Filter by active role's assigned lembaga_id
    const roleAssignedIds = userRoles
      .filter(r => r.role === userRole && r.lembaga_id !== null)
      .map(r => Number(r.lembaga_id));

    // Also include lembaga_id from pegawai_lembaga relations
    const pegawaiAssignedIds = ((pegawaiData as any)?.pegawai_lembaga || [])
      .map((pl: any) => Number(pl.lembaga_id))
      .filter((id: number) => !isNaN(id) && id > 0);

    const allAssignedIds = Array.from(new Set([...roleAssignedIds, ...pegawaiAssignedIds]));

    if (allAssignedIds.length === 0) {
      // Fallback: any lembaga in userRoles
      const fallbackIds = userRoles
        .map(r => (r.lembaga_id !== null ? Number(r.lembaga_id) : null))
        .filter((id): id is number => id !== null && !isNaN(id));
      if (fallbackIds.length > 0) {
        return allLembagas.filter((l: any) => fallbackIds.includes(Number(l.lembaga_id)));
      }
      return allLembagas;
    }

    return allLembagas.filter((l: any) => allAssignedIds.includes(Number(l.lembaga_id)));
  }, [lembagas, isGlobalRole, userRoles, userRole, pegawaiData]);

  // Keep active lembaga strictly within allowedLembagas for non-global roles
  useEffect(() => {
    if (!isGlobalRole && allowedLembagas.length > 0) {
      const isCurrentValid = allowedLembagas.some((l: any) => Number(l.lembaga_id) === Number(userLembaga));
      if (!isCurrentValid) {
        const first = allowedLembagas[0];
        setActiveRole({
          role: userRole || 'Guru',
          lembaga_id: first.lembaga_id,
          lembaga_name: first.singkatan || first.nama_lembaga,
        });
      }
    }
  }, [isGlobalRole, allowedLembagas, userLembaga, userRole, setActiveRole]);

  const handleRoleChange = (newRole: string) => {
    let targetContext = userRoles.find(r => r.role === newRole && r.lembaga_id !== null);
    if (!targetContext) {
      const defaultLembagaId = (allowedLembagas.length > 0 && !['Super Admin', 'Direktur'].includes(newRole))
        ? allowedLembagas[0].lembaga_id
        : null;
      targetContext = {
        role: newRole as any,
        lembaga_id: defaultLembagaId,
        lembaga_name: allowedLembagas.find((l: any) => l.lembaga_id === defaultLembagaId)?.singkatan || null,
      };
    }
    setActiveRole(targetContext);
    queryClient.invalidateQueries();
    navigate('/dashboard');
  };

  const handleLembagaChange = (lembagaId: number | null) => {
    const lembagaInfo = allowedLembagas.find((l: any) => l.lembaga_id === lembagaId) || lembagas.find((l: any) => l.lembaga_id === lembagaId);
    setActiveRole({
      role: userRole || 'Super Admin',
      lembaga_id: lembagaId,
      lembaga_name: lembagaInfo ? (lembagaInfo.singkatan || lembagaInfo.nama_lembaga) : null,
    });
    queryClient.invalidateQueries();
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await authServiceLogout();
    } catch (error) {
      console.warn("Logout notice:", error);
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password berhasil diubah!");
      setIsPasswordModalOpen(false);
      setPasswordForm({ old_password: '', new_password: '' });
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "Gagal mengubah kata sandi. Pastikan kata sandi lama sudah benar.";
      toast.error(errorMsg);
    }
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password.length < 6) {
      toast.error("Password baru harus memiliki minimal 6 karakter.");
      return;
    }
    passwordMutation.mutate(passwordForm);
  };

  const menuGroups = allMenuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.allowedRoles || (userRole && item.allowedRoles.includes(userRole)))
  })).filter(group => group.items.length > 0);

  return (
    <div className="flex h-dvh bg-[#F4F7FE] overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 ${isCollapsed ? "lg:w-20" : "lg:w-64"
          } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } bg-[#1e2f65] text-white transition-all duration-300 fixed lg:relative z-50 h-dvh flex flex-col shrink-0`}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <StaticIslamicPattern className="opacity-50" opacity={0.07} />
        </div>
        {/* Collapse Button (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-20 bg-[#FACC15] text-[#1e2f65] rounded-full p-1.5 z-10 shadow-lg shadow-yellow-500/20 border border-yellow-300 hover:bg-yellow-300 hover:scale-110 hover:shadow-yellow-500/40 transition-all hidden lg:flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
        </button>

        {/* Close Button (Mobile Only) — panah kuning keluar dari sisi kanan sidebar */}
        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="absolute -right-4 top-20 bg-[#FACC15] text-[#1e2f65] rounded-full p-1.5 z-10 shadow-lg shadow-yellow-500/20 border border-yellow-300 hover:bg-yellow-300 hover:scale-110 hover:shadow-yellow-500/40 transition-all flex lg:hidden items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-3 p-6 h-20 mt-2">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight text-white">Pondok Pesantren</span>
              <span className="font-bold text-[#FACC15] text-sm leading-tight">Maskumambang</span>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="px-6 mb-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FACC15] text-[#1e2f65] font-bold flex items-center justify-center shrink-0 text-lg">
              {displayInitial}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col overflow-hidden w-full pr-2">
                <span className="font-semibold text-xs truncate">{displayName}</span>
                {hasRole && (() => {
                  const safeLembagas = Array.isArray(lembagas) ? lembagas : [];
                  const activeLembagaInfo = userLembaga
                    ? safeLembagas.find((l: any) => String(l.lembaga_id) === String(userLembaga))
                    : null;
                  const lembagaLabel = activeLembagaInfo
                    ? (activeLembagaInfo.singkatan || activeLembagaInfo.nama_lembaga)
                    : null;

                  return (
                    <div className="flex flex-col gap-0.5 mt-1 w-full">
                      <select
                        className="text-[10px] text-slate-200 bg-[#2A4080] border border-slate-500/40 rounded-md px-2 py-1 outline-none cursor-pointer hover:bg-[#334d99] transition-colors appearance-none w-full"
                        value={userRole || ''}
                        onChange={(e) => handleRoleChange(e.target.value)}
                      >
                        {availableRoles.map((r, i) => (
                          <option key={i} value={r} className="bg-[#1e2f65] text-white">
                            {r}
                          </option>
                        ))}
                      </select>
                      {lembagaLabel && (
                        <span className="text-[9px] text-slate-400 truncate leading-tight mt-0.5">📍 {lembagaLabel}</span>
                      )}
                    </div>
                  );
                })()}

              </div>
            )}
          </div>
        </div>

        {/* Nav Items — hanya tampil jika user memiliki role */}
        <div className="flex-1 overflow-y-auto mt-2 space-y-4 pb-4">
          {hasRole && menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col">
              {(!isCollapsed || isMobileOpen) && (
                <span className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
                  {group.category}
                </span>
              )}
              <div className="flex flex-col space-y-1 mt-1">
                {group.items.map((item, idx) => {
                  const isActive = location.pathname === item.path || (location.pathname === "/" && item.path === "/");
                  return (
                    <Link
                      key={idx}
                      to={item.path}
                      onClick={(e) => handleLinkClick(e, item.path)}
                      className={`flex items-center gap-3 px-6 py-2.5 transition-colors border-l-[3px] ${isActive
                        ? "bg-[#2A4080] border-[#FACC15] text-white"
                        : "border-transparent text-slate-300 hover:bg-[#2A4080]/50 hover:text-white"
                        }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#FACC15]" : ""}`} />
                      {(!isCollapsed || isMobileOpen) && <span className="text-sm font-medium truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Actions Area — Ubah Password & Keluar (selalu tampil) */}
        <div className="p-4 mt-auto mb-2 flex flex-col gap-1">
          <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-[#2A4080] w-full rounded-lg transition-colors"
              >
                <KeyRound className="w-5 h-5 shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span className="text-sm font-medium">Ubah Password</span>}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25 p-6 rounded-[24px] border-none shadow-xl bg-white">
              <form onSubmit={handleChangePassword}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-slate-800">Ubah Password</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="old_password">Password Lama</Label>
                    <div className="relative">
                      <Input id="old_password" type={showOldPassword ? "text" : "password"} required value={passwordForm.old_password} onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })} className="rounded-xl h-11 pr-12" />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="new_password">Password Baru</Label>
                    <div className="relative">
                      <Input id="new_password" type={showNewPassword ? "text" : "password"} required value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="rounded-xl h-11 pr-12" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex gap-2 sm:justify-between w-full mt-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:flex-1 rounded-xl h-11 border-slate-200">Batal</Button>
                  </DialogClose>
                  <Button type="submit" disabled={passwordMutation.isPending} className="w-full sm:flex-1 rounded-xl h-11 bg-[#2A4080] hover:bg-[#1C2D5C] text-white">
                    {passwordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <button
            onClick={() => queryClient.invalidateQueries()}
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-[#2A4080] w-full rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 shrink-0 ${isFetching > 0 ? 'animate-spin' : ''}`} />
            {(!isCollapsed || isMobileOpen) && <span className="text-sm font-medium">Refresh Data</span>}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-[#2A4080] w-full rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className="text-sm font-medium">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-dvh overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="bg-white flex items-center justify-between px-6 border-b border-gray-200 shrink-0 h-16">
          <div>
            <button
              className="lg:hidden text-slate-600 p-1 hover:bg-slate-100 rounded-md"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Role and Lembaga Selector */}
            {hasRole && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <div className="flex flex-col text-right mr-1">
                  <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">ROLE</span>
                </div>
                <select
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:bg-slate-100 focus:ring-2 focus:ring-blue-500 shadow-xs"
                  value={userRole || ''}
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  {availableRoles.map((role, i) => (
                    <option key={`header-role-${i}`} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                {/* Lembaga Selector */}
                {(() => {
                  const showLembagaSelector = isGlobalRole || allowedLembagas.length > 0;

                  if (showLembagaSelector && allowedLembagas.length > 0) {
                    return (
                      <select
                        className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:bg-slate-100 focus:ring-2 focus:ring-blue-500 max-w-44 truncate shadow-xs"
                        value={userLembaga || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          handleLembagaChange(val);
                        }}
                      >
                        {isSuperAdmin && (
                          <option value="">Semua Lembaga</option>
                        )}
                        {allowedLembagas.map((l: any, i: number) => (
                          <option key={`lembaga-opt-${i}`} value={l.lembaga_id}>
                            {l.singkatan || l.nama_lembaga}
                          </option>
                        ))}
                      </select>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        </header>

        {/* Main View */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 flex flex-col">
            {!hasRole ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 px-4 text-center">
                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                  <ShieldOff className="w-10 h-10 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-700 mb-2">Akses Terbatas</h2>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Anda belum memiliki akses untuk halaman ini! Hubungi administrator untuk mendapatkan hak akses.
                  </p>
                </div>
              </div>
            ) : (
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            )}
          </div>

          {/* Copyright Footer */}
          <footer className="w-full shrink-0 text-right py-4 pr-6 mt-auto">
            <ProtectedCopyright
              lines={['© 2026 Universitas Negeri Malang']}
              align="right"
              fontSize={13}
              color="rgba(148, 163, 184, 0.9)"
            />
          </footer>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

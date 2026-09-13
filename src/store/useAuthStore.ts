import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ROLE } from '../types/database';

interface UserData {
  user_id: string;
  username?: string;
  pegawai_id?: number;
}

export interface UserRoleContext {
  role: ROLE['nama_role'];
  lembaga_id: number | null;
  lembaga_name?: string | null;
}

interface AuthState {
  user: UserData | null;
  token: string | null;
  role: ROLE['nama_role'] | null;
  lembaga_id: number | null;
  roles: UserRoleContext[];
  isAuthLoading: boolean;

  // Actions
  setUser: (user: UserData, roles: UserRoleContext[], activeRole?: UserRoleContext) => void;
  setToken: (token: string) => void;
  setActiveRole: (roleContext: UserRoleContext) => void;
  setAuthLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      lembaga_id: null,
      roles: [],
      isAuthLoading: true,

      setUser: (user, roles, activeRole) => {
        const defaultActive = activeRole || roles[0] || null;
        set({
          user,
          roles,
          role: defaultActive?.role ?? null,
          lembaga_id: defaultActive?.lembaga_id ?? null,
          isAuthLoading: false,
        });
      },

      setToken: (token) => set({ token }),

      setActiveRole: (roleContext) =>
        set({ role: roleContext.role, lembaga_id: roleContext.lembaga_id }),

      setAuthLoading: (loading) => set({ isAuthLoading: loading }),

      logout: () =>
        set({ user: null, token: null, role: null, lembaga_id: null, roles: [], isAuthLoading: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
        lembaga_id: state.lembaga_id,
        roles: state.roles,
      }),
    }
  )
);

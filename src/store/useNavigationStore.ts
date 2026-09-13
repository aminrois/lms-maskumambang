import { create } from 'zustand';

interface NavigationStore {
  blockingFn: (() => boolean) | null;
  setBlockingFn: (fn: (() => boolean) | null) => void;
  pendingPath: string | null;
  setPendingPath: (path: string | null) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  blockingFn: null,
  setBlockingFn: (fn) => set({ blockingFn: fn }),
  pendingPath: null,
  setPendingPath: (path) => set({ pendingPath: path }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MenuTrackerState {
  visits: Record<string, number>;
  trackVisit: (path: string) => void;
}

export const useMenuTrackerStore = create<MenuTrackerState>()(
  persist(
    (set) => ({
      visits: {},
      trackVisit: (path) => set((state) => ({
        visits: {
          ...state.visits,
          [path]: (state.visits[path] || 0) + 1
        }
      }))
    }),
    { 
      name: 'menu-tracker-storage' 
    }
  )
);

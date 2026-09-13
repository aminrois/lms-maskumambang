import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useMenuTrackerStore } from '../store/useMenuTrackerStore';
import { allMenuGroups, type MenuItem } from '../config/menuConfig';

export const useDynamicQuickMenu = (limit: number = 4) => {
  const userRole = useAuthStore(state => state.role) || '';
  const visits = useMenuTrackerStore(state => state.visits);

  const quickMenuItems = useMemo(() => {
    // 1. Flatten all menu items except "Umum" (Dashboard)
    const flatItems: MenuItem[] = [];
    allMenuGroups.forEach(group => {
      if (group.category !== 'Umum') {
        flatItems.push(...group.items);
      }
    });

    // 2. Filter items allowed for the current user's role
    const allowedItems = flatItems.filter(item => 
      !item.allowedRoles || item.allowedRoles.includes(userRole)
    );

    // 3. Sort by visits descending
    const sortedItems = allowedItems.sort((a, b) => {
      const visitsA = visits[a.path] || 0;
      const visitsB = visits[b.path] || 0;
      return visitsB - visitsA;
    });

    // 4. Return the top N items
    return sortedItems.slice(0, limit);
  }, [userRole, visits, limit]);

  return quickMenuItems;
};

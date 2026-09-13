import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  SESSION_TIMEOUT_CONFIG,
  TIMEOUT_WHITELIST_PATHS,
  LAST_ACTIVITY_KEY,
  TAB_HIDDEN_AT_KEY,
} from '../config/sessionTimeout';

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, logout, user } = useAuthStore();

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // References to keep track of timers
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine if current path is whitelisted
  const isWhitelisted = TIMEOUT_WHITELIST_PATHS.includes(location.pathname as any);

  // Get configuration for current role
  const config = role ? SESSION_TIMEOUT_CONFIG[role] : null;

  const performLogout = useCallback(async () => {
    // Clear any existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);

    // Clear local storage
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(TAB_HIDDEN_AT_KEY);

    // Close modal
    setShowWarning(false);
    
    // Logout: bersihkan token & state
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const handleManualExtend = useCallback(() => {
    if (!user || !config || isWhitelisted) return;
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    setShowWarning(false);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  }, [user, config, isWhitelisted]);

  const updateLastActivity = useCallback(() => {
    // Jika peringatan sedang muncul, abaikan aktivitas background.
    // User harus klik "Perpanjang Sesi" secara manual.
    if (!user || !config || isWhitelisted || showWarning) return;
    
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }, [user, config, isWhitelisted, showWarning]);

  const checkInactivity = useCallback(() => {
    if (!user || !config || isWhitelisted) {
      setShowWarning(false);
      return;
    }

    const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;

    const { inactivityMs, warningMs } = config;
    const timeUntilWarning = inactivityMs - warningMs;

    if (timeSinceLastActivity >= inactivityMs) {
      // Timeout exceeded
      performLogout();
    } else if (timeSinceLastActivity >= timeUntilWarning) {
      // Show warning
      if (!showWarning) {
        setShowWarning(true);
      }
    } else {
      // All good, hide warning if shown
      if (showWarning) {
        setShowWarning(false);
      }
    }
  }, [user, config, isWhitelisted, showWarning, performLogout]);

  // Manage countdown interval when showWarning is true
  useEffect(() => {
    if (showWarning && config) {
      const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const remainingSeconds = Math.max(0, Math.ceil((config.inactivityMs - timeSinceLastActivity) / 1000));
      
      setCountdown(remainingSeconds);

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            performLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      };
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }
  }, [showWarning, config, performLogout]);

  // Initial setup and event listeners for activity
  useEffect(() => {
    if (!user || !config || isWhitelisted) return;

    // Initialize last activity if not present
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    // Throttle the update to avoid hammering localStorage
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        updateLastActivity();
        throttleTimeout = null;
      }, 1000);
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check inactivity periodically
    checkIntervalRef.current = setInterval(checkInactivity, 5000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (throttleTimeout) clearTimeout(throttleTimeout);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [user, config, isWhitelisted, updateLastActivity, checkInactivity]);

  // Tab hidden/visible logic
  useEffect(() => {
    if (!user || !config || isWhitelisted) return;

    const checkHiddenGracePeriod = () => {
      const hiddenAtStr = localStorage.getItem(TAB_HIDDEN_AT_KEY);
      if (hiddenAtStr) {
        const hiddenAt = parseInt(hiddenAtStr, 10);
        const now = Date.now();
        const { tabClosedGraceMs } = config;

        if (now - hiddenAt >= tabClosedGraceMs) {
          // Grace period exceeded while tab was hidden
          performLogout();
        } else {
          // Returned before grace period, cleanup hidden tracker and update activity
          localStorage.removeItem(TAB_HIDDEN_AT_KEY);
          updateLastActivity();
        }
      }
    };

    // Pengecekan saat pertama kali render (mount) untuk skenario di mana
    // pengguna membuka kembali aplikasi di tab baru setelah tab sebelumnya ditutup
    if (document.visibilityState === 'visible') {
      checkHiddenGracePeriod();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem(TAB_HIDDEN_AT_KEY, Date.now().toString());
      } else if (document.visibilityState === 'visible') {
        checkHiddenGracePeriod();
      }
    };

    // Listener fallback tambahan: pagehide sering lebih handal untuk mendeteksi penutupan tab secara paksa
    const handlePageHide = () => {
      localStorage.setItem(TAB_HIDDEN_AT_KEY, Date.now().toString());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [user, config, isWhitelisted, performLogout, updateLastActivity]);

  return {
    showWarning,
    countdown,
    extendSession: handleManualExtend,
    logout: performLogout,
  };
};

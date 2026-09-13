import React from 'react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import SessionTimeoutModal from './SessionTimeoutModal';

export const SessionTimeoutGuard: React.FC = () => {
  const { showWarning, countdown, extendSession, logout } = useSessionTimeout();

  return (
    <SessionTimeoutModal
      isOpen={showWarning}
      countdown={countdown}
      onExtend={extendSession}
      onLogout={logout}
    />
  );
};

export default SessionTimeoutGuard;

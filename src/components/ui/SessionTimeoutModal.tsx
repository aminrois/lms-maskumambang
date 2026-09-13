import React from 'react';
import { Button } from './button';
import { AlertTriangle, LogOut } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  countdown: number;
  onExtend: () => void;
  onLogout: () => void;
}

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  countdown,
  onExtend,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Sesi Anda Akan Berakhir
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400">
            Karena tidak ada aktivitas, sesi Anda akan otomatis ditutup demi keamanan dalam waktu:
          </p>

          <div className="text-5xl font-mono font-extrabold text-red-600 my-4 tracking-tight">
            {Math.floor(countdown / 60).toString().padStart(2, '0')}:{(countdown % 60).toString().padStart(2, '0')}
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pilih "Perpanjang Sesi" untuk tetap masuk, atau "Keluar Sekarang" jika Anda sudah selesai.
          </p>

          <div className="flex w-full gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar Sekarang
            </Button>
            <Button
              className="flex-1 bg-[#1e2f65] hover:bg-[#1e2f65]/90 text-white"
              onClick={onExtend}
            >
              Perpanjang Sesi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;

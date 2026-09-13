import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { WifiOff, Loader2 } from 'lucide-react';

const GlobalNetworkHandler: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Koneksi internet kembali pulih.", {
        id: 'network-status',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Masalah koneksi ke server. Mohon periksa jaringan internet Anda.", {
        id: 'network-status',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto">
      <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center max-w-sm w-full mx-4 border border-slate-100 text-center animate-in zoom-in-95 duration-300">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-red-50 text-red-500 w-20 h-20 rounded-full flex items-center justify-center shadow-sm border border-red-100">
            <WifiOff className="w-10 h-10" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Terputus dari Jaringan</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Koneksi ke server terputus. Pekerjaan Anda mungkin belum tersimpan. Silakan periksa koneksi internet Anda.
        </p>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-full w-full justify-center shadow-inner">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          Menghubungkan kembali...
        </div>
      </div>
    </div>
  );
};

export default GlobalNetworkHandler;

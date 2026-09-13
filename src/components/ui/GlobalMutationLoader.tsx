import React from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const GlobalMutationLoader: React.FC = () => {
  // Returns the number of active mutations in the QueryClient that don't have hideGlobalLoader meta
  const isMutating = useIsMutating({
    predicate: (mutation) => mutation.meta?.hideGlobalLoader !== true
  });

  if (isMutating === 0) return null;

  return (
    <div className="fixed inset-0 z-9999 bg-slate-900/20 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-wait pointer-events-auto">
      <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-200">
        <Loader2 className="w-6 h-6 animate-spin text-[#2B3674]" />
        <span className="font-semibold text-[#2B3674]">Memproses Data...</span>
      </div>
    </div>
  );
};

export default GlobalMutationLoader;

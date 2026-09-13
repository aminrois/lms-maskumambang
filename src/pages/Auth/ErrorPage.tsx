import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, FileQuestion, ServerCrash, LogIn, Lock, AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
  code?: 400 | 401 | 403 | 404 | 409 | 500;
  title?: string;
  message?: string;
}

const errorData = {
  400: {
    icon: <ShieldAlert className="w-24 h-24 text-orange-500 animate-pulse" />,
    defaultTitle: "Bad Request",
    defaultMessage: "Permintaan Anda tidak dapat diproses oleh server.",
    color: "from-orange-500/20 to-orange-900/20",
    textShadow: "shadow-orange-500/50"
  },
  401: {
    icon: <Lock className="w-24 h-24 text-yellow-500 animate-pulse" />,
    defaultTitle: "Unauthorized",
    defaultMessage: "Sesi Anda telah berakhir atau Anda belum login.",
    color: "from-yellow-500/20 to-yellow-900/20",
    textShadow: "shadow-yellow-500/50"
  },
  403: {
    icon: <ShieldAlert className="w-24 h-24 text-red-500 animate-pulse" />,
    defaultTitle: "Akses Ditolak",
    defaultMessage: "Anda tidak memiliki hak akses (Role) yang cukup untuk membuka halaman ini.",
    color: "from-red-500/20 to-red-900/20",
    textShadow: "shadow-red-500/50"
  },
  404: {
    icon: <FileQuestion className="w-24 h-24 text-blue-500 animate-bounce" />,
    defaultTitle: "Halaman Tidak Ditemukan",
    defaultMessage: "Maaf, halaman yang Anda cari mungkin telah dipindah atau tidak pernah ada.",
    color: "from-blue-500/20 to-blue-900/20",
    textShadow: "shadow-blue-500/50"
  },
  409: {
    icon: <AlertTriangle className="w-24 h-24 text-pink-500 animate-pulse" />,
    defaultTitle: "Konflik Data",
    defaultMessage: "Data yang Anda masukkan sudah ada atau terjadi konflik dengan data lain.",
    color: "from-pink-500/20 to-pink-900/20",
    textShadow: "shadow-pink-500/50"
  },
  500: {
    icon: <ServerCrash className="w-24 h-24 text-purple-500 animate-pulse" />,
    defaultTitle: "Internal Server Error",
    defaultMessage: "Terjadi kesalahan pada server kami. Silakan coba beberapa saat lagi.",
    color: "from-purple-500/20 to-purple-900/20",
    textShadow: "shadow-purple-500/50"
  }
};

const ErrorPage: React.FC<ErrorPageProps> = ({ code = 404, title, message }) => {
  const navigate = useNavigate();
  const data = errorData[code];

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#0B0F19] text-white overflow-hidden relative">
      {/* Background glow effects */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-linear-to-tr ${data.color} rounded-full blur-[100px] opacity-60 pointer-events-none`}></div>
      
      <div className="relative z-10 max-w-2xl w-full px-4 md:px-6 flex flex-col items-center text-center space-y-8 backdrop-blur-sm">
        
        {/* Icon & Status Code */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
            {data.icon}
          </div>
          <h1 className="text-8xl md:text-9xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-white to-white/40 drop-shadow-2xl">
            {code}
          </h1>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white/90">
            {title || data.defaultTitle}
          </h2>
          <p className="text-lg md:text-xl text-white/60 max-w-lg mx-auto leading-relaxed">
            {message || data.defaultMessage}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8">
          <button 
            onClick={() => navigate('/login')}
            className="group flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-full font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Ke Halaman Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;

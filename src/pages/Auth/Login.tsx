import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldAlert, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { login } from '../../lib/api/services/authService';
import { IslamicPatternBackground } from './components/IslamicPatternBackground';
import HCaptchaWidget from '../../components/ui/HCaptchaWidget';
import type HCaptcha from '@hcaptcha/react-hcaptcha';
import { ProtectedCopyright } from '../../components/ProtectedCopyright';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, setToken, setUser } = useAuthStore();

  const [nig, setNig] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Ref untuk reset widget setelah login gagal
  const hcaptchaRef = useRef<HCaptcha>(null);

  // Jika user sudah login (sesi masih aktif), langsung redirect ke dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Blokir submit jika CAPTCHA belum diverifikasi
    if (!captchaToken) {
      setError('Harap selesaikan verifikasi CAPTCHA terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      // Login ke custom backend — mendapat token JWT & data user langsung
      const data = await login({
        username: nig.trim(),
        password: password,
      });

      // Simpan token ke Zustand store & localStorage
      setToken(data.token);

      // Proses roles dari response
      const rolesContexts = data.user.roles.map((ur: any) => ({
        role: ur.nama_role,
        lembaga_id: ur.lembaga_id ?? null,
        lembaga_name: ur.lembaga ? (ur.lembaga.singkatan || ur.lembaga.nama_lembaga) : null,
      }));

      // Blokir role Wali Murid dari akses web
      const isWaliMurid = rolesContexts.some((r: any) => r.role === 'Wali Murid') && rolesContexts.length === 1;
      if (isWaliMurid) {
        setError('Akun Wali Murid tidak memiliki akses ke aplikasi web ini.');
        return;
      }

      setUser({
        user_id: data.user.user_id,
        username: data.user.username,
        pegawai_id: data.user.pegawai?.pegawai_id,
      }, rolesContexts);

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      // Reset CAPTCHA setelah login gagal agar user harus verifikasi ulang
      hcaptchaRef.current?.resetCaptcha();
      setCaptchaToken(null);

      let rawMessage = '';
      if (typeof err === 'string') {
        rawMessage = err;
      } else if (err?.message && typeof err.message === 'string') {
        rawMessage = err.message;
      } else if (err?.error_description && typeof err.error_description === 'string') {
        rawMessage = err.error_description;
      } else if (err?.response?.data?.error_description && typeof err.response.data.error_description === 'string') {
        rawMessage = err.response.data.error_description;
      } else if (err?.response?.data?.message && typeof err.response.data.message === 'string') {
        rawMessage = err.response.data.message;
      }

      rawMessage = rawMessage.trim();

      let errorMessage = 'NIG atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.';

      if (
        !rawMessage ||
        rawMessage === '{}' ||
        rawMessage === '[object Object]' ||
        rawMessage.toLowerCase().includes('invalid login credentials') ||
        rawMessage.toLowerCase().includes('invalid credentials') ||
        rawMessage.toLowerCase().includes('invalid_grant')
      ) {
        errorMessage = 'NIG atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.';
      } else if (rawMessage.toLowerCase().includes('email not confirmed')) {
        errorMessage = 'Akun Anda belum dikonfirmasi. Silakan hubungi administrator.';
      } else if (rawMessage.toLowerCase().includes('user not found')) {
        errorMessage = 'Pengguna dengan NIG tersebut tidak ditemukan.';
      } else if (rawMessage.toLowerCase().includes('too many requests') || rawMessage.toLowerCase().includes('rate limit')) {
        errorMessage = 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.';
      } else {
        errorMessage = rawMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Tombol submit aktif hanya jika CAPTCHA sudah diverifikasi
  const isSubmitReady = !!captchaToken && !loading;

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden font-sans bg-[#090F26]">
      {/* Animated Islamic Geometric Canvas Background */}
      <IslamicPatternBackground />

      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 z-10 w-full">
        {/* Brand Header - Logo & Title */}
        <div className="flex flex-col items-center text-center text-white mb-4 sm:mb-8 z-10 animate-fade-in mt-2 sm:mt-0">
          <div className="relative p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl mb-3 sm:mb-4 group hover:scale-105 transition-transform duration-300">
            <img
              src="/logo.png"
              alt="Logo Pesantren Maskumambang"
              className="w-14 h-14 sm:w-24 sm:h-24 object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-amber-200 via-yellow-100 to-white drop-shadow-sm">
            Learning Management System (LMS)
          </h1>
          <p className="text-blue-200/90 text-sm sm:text-base mt-1.5 leading-relaxed max-w-sm font-semibold flex flex-col items-center">
            <span>Pondok Pesantren Maskumambang</span>
            <span>Gresik - Jawa Timur</span>
          </p>
        </div>

        {/* Login Card with Glassmorphism */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-5 sm:p-10 w-full max-w-md z-10 transition-all duration-300">
          <div className="mb-5 sm:mb-8 flex flex-col items-center text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1 sm:mb-1.5 tracking-tight">Login System</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Silakan masuk menggunakan NIG dan kata sandi akun Anda</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200/80 flex items-start gap-2.5 shadow-xs">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nomor Induk Guru (NIG)</label>
              <input
                type="text"
                value={nig}
                onChange={(e) => setNig(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-gray-50/50 hover:bg-gray-50 transition-colors placeholder:text-gray-400"
                placeholder="Masukkan NIG Anda"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-gray-50/50 hover:bg-gray-50 transition-colors placeholder:text-gray-400 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* hCaptcha Widget */}
            <div className="pt-1">
              <HCaptchaWidget
                ref={hcaptchaRef}
                onVerify={(token) => {
                  setCaptchaToken(token);
                  if (error === 'Harap selesaikan verifikasi CAPTCHA terlebih dahulu.') {
                    setError('');
                  }
                }}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
              />
              {/* Indikator status CAPTCHA */}
              {captchaToken && (
                <div className="flex items-center justify-start gap-1.5 mt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] text-emerald-600 font-medium">Verifikasi berhasil</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!isSubmitReady}
              className={`w-full py-3.5 rounded-lg font-semibold transition-all duration-300 mt-1 text-sm shadow-lg disabled:cursor-not-allowed
              ${isSubmitReady
                  ? 'bg-[#1a2b6d] hover:bg-[#121f52] text-white shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed'
                }`}
            >
              {loading ? 'Memproses...' : !captchaToken ? 'Selesaikan CAPTCHA dahulu' : 'Masuk ke Sistem'}
            </button>
          </form>

          <div className="mt-10 flex justify-center items-center opacity-60">
            {/* Small Footer Logo */}
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
              <span className="text-[9px] font-bold text-gray-500 tracking-[0.15em] leading-tight">
                PONDOK PESANTREN MASKUMAMBANG
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="w-full z-10 text-center px-4 pb-4 sm:pb-6 mt-4">
        <ProtectedCopyright
          lines={[
            '© 2026 Universitas Negeri Malang',
            'Developed by Tim UM Belajar Bersama Masyarakat (UM BBM) Pondok Pesantren Maskumambang'
          ]}
          align="center"
          fontSize={14}
          color="rgba(191, 219, 254, 0.75)"
          className="max-w-4xl mx-auto"
        />
      </div>
    </div>
  );
};

export default Login;

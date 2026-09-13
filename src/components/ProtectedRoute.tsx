import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { ROLE } from '../types/database';

interface ProtectedRouteProps {
  allowedRoles?: ROLE['nama_role'][];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, role, isAuthLoading } = useAuthStore();

  // Tunggu sampai Supabase selesai mengecek sesi sebelum memutuskan redirect
  if (isAuthLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuat sesi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Belum login → redirect ke login
    return <Navigate to="/login" replace />;
  }

  // Jika route ini membutuhkan role tertentu namun role belum ada (null),
  // redirect ke dashboard untuk menghindari layar putih (race condition saat ganti role)
  if (allowedRoles && !role) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Role diizinkan → render child routes
  return <Outlet />;
};

export default ProtectedRoute;

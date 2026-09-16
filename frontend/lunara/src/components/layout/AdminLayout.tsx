import React, { useState } from 'react';
import { Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-8">Đang xác thực…</div>;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (location.pathname.startsWith('/staff') && user.roleCode !== 'THERAPIST') return <Navigate to="/admin/dashboard" replace />;
  if (location.pathname.startsWith('/admin') && user.roleCode === 'CUSTOMER') return <Navigate to="/booking" replace />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9F5] font-body">
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#14271C]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-[#14271C]">
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-full text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminSidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <div className="lg:hidden h-16 bg-white border-b border-[#E2E8E3] px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl text-[#14271C] hover:bg-[#F8F9F5]"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/admin/dashboard" className="font-display font-bold text-xl text-[#14271C]">
            Lunara Admin
          </Link>

          <div className="w-8" />
        </div>

        {/* Desktop TopBar */}
        <AdminTopBar />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#F8F9F5]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

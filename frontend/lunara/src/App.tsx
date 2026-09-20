import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessAdminRoute, ROLE_HOME } from '@/lib/access-control';

// Customer Flow
const page = <T extends object>(loader: () => Promise<T>, name: keyof T) =>
  lazy(async () => ({ default: (await loader())[name] as ComponentType }));
const LandingPage = page(() => import('@/pages/LandingPage'), 'LandingPage');
const AuthPage = page(() => import('@/pages/AuthPage'), 'AuthPage');
const OAuth2RedirectPage = page(() => import('@/pages/OAuth2RedirectPage'), 'OAuth2RedirectPage');
const BookingPage = page(() => import('@/pages/BookingPage'), 'BookingPage');
const CheckoutPage = page(() => import('@/pages/CheckoutPage'), 'CheckoutPage');
const TicketPage = page(() => import('@/pages/TicketPage'), 'TicketPage');
const AdminLoginPage = page(() => import('@/pages/admin/AdminLoginPage'), 'AdminLoginPage');
const AdminLayout = page(() => import('@/components/layout/AdminLayout'), 'AdminLayout');
const DashboardPage = page(() => import('@/pages/admin/DashboardPage'), 'DashboardPage');
const LivePage = page(() => import('@/pages/admin/LivePage'), 'LivePage');
const BookingsPage = page(() => import('@/pages/admin/BookingsPage'), 'BookingsPage');
const CalendarPage = page(() => import('@/pages/admin/CalendarPage'), 'CalendarPage');
const CustomersPage = page(() => import('@/pages/admin/CustomersPage'), 'CustomersPage');
const StaffPage = page(() => import('@/pages/admin/StaffPage'), 'StaffPage');
const ServicesPage = page(() => import('@/pages/admin/ServicesPage'), 'ServicesPage');
const PaymentsPage = page(() => import('@/pages/admin/PaymentsPage'), 'PaymentsPage');
const UsersRolePage = page(() => import('@/pages/admin/UsersRolePage'), 'UsersRolePage');
const ReportsPage = page(() => import('@/pages/admin/ReportsPage'), 'ReportsPage');
const MyWorkPage = page(() => import('@/pages/staff/MyWorkPage'), 'MyWorkPage');
const MyCalendarPage = page(() => import('@/pages/staff/MyCalendarPage'), 'MyCalendarPage');

function RequireAdminRoute({ path, children }: { path: string; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Đang xác thực…</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!canAccessAdminRoute(user.roleCode, path)) return <Navigate to={ROLE_HOME[user.roleCode]} replace />;
  return children;
}

function RoleHomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Đang xác thực…</div>;
  return <Navigate to={user ? ROLE_HOME[user.roleCode] : '/admin/login'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="p-8">Đang tải…</div>}>
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/ticket/:id" element={<TicketPage />} />

            {/* Admin Authentication */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Management Workspace */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<RoleHomeRedirect />} />
              <Route path="dashboard" element={<RequireAdminRoute path="/admin/dashboard"><DashboardPage /></RequireAdminRoute>} />
              <Route path="live" element={<RequireAdminRoute path="/admin/live"><LivePage /></RequireAdminRoute>} />
              <Route path="booking" element={<RequireAdminRoute path="/admin/booking"><BookingsPage /></RequireAdminRoute>} />
              <Route path="calendar" element={<RequireAdminRoute path="/admin/calendar"><CalendarPage /></RequireAdminRoute>} />
              <Route path="customers" element={<RequireAdminRoute path="/admin/customers"><CustomersPage /></RequireAdminRoute>} />
              <Route path="staff" element={<RequireAdminRoute path="/admin/staff"><StaffPage /></RequireAdminRoute>} />
              <Route path="services" element={<RequireAdminRoute path="/admin/services"><ServicesPage /></RequireAdminRoute>} />
              <Route path="payments" element={<RequireAdminRoute path="/admin/payments"><PaymentsPage /></RequireAdminRoute>} />
              <Route path="user-role" element={<RequireAdminRoute path="/admin/user-role"><UsersRolePage /></RequireAdminRoute>} />
              <Route path="reports" element={<RequireAdminRoute path="/admin/reports"><ReportsPage /></RequireAdminRoute>} />
            </Route>

            {/* Staff Portal */}
            <Route path="/staff" element={<AdminLayout />}>
              <Route index element={<Navigate to="/staff/my-work" replace />} />
              <Route path="my-work" element={<MyWorkPage />} />
              <Route path="calendar" element={<MyCalendarPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;

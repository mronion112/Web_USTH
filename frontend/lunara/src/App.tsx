import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

// Customer Flow
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { BookingPage } from '@/pages/BookingPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { TicketPage } from '@/pages/TicketPage';

// Admin Flow
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { LivePage } from '@/pages/admin/LivePage';
import { BookingsPage } from '@/pages/admin/BookingsPage';
import { CalendarPage } from '@/pages/admin/CalendarPage';
import { CustomersPage } from '@/pages/admin/CustomersPage';
import { StaffPage } from '@/pages/admin/StaffPage';
import { ServicesPage } from '@/pages/admin/ServicesPage';
import { PaymentsPage } from '@/pages/admin/PaymentsPage';
import { UsersRolePage } from '@/pages/admin/UsersRolePage';
import { ReportsPage } from '@/pages/admin/ReportsPage';

// Staff Flow
import { MyWorkPage } from '@/pages/staff/MyWorkPage';
import { MyCalendarPage } from '@/pages/staff/MyCalendarPage';
import { OAuth2RedirectPage } from '@/pages/OAuth2RedirectPage';

function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <TooltipProvider>
        <BrowserRouter>
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
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="live" element={<LivePage />} />
              <Route path="booking" element={<BookingsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="user-role" element={<UsersRolePage />} />
              <Route path="reports" element={<ReportsPage />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;

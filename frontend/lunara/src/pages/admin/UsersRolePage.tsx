import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Shield, UserCheck, Check, Key } from 'lucide-react';

export const UsersRolePage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'THERAPIST'>('MANAGER');

  const usersList = [
    { name: 'Hoàng Thị Lan', email: 'lan.hoang@lunara.vn', role: 'Chủ Spa (Owner)', status: 'Active', lastActive: 'Vừa xong' },
    { name: 'Trần Văn Minh', email: 'minh.tran@lunara.vn', role: 'Quản lý (Manager)', status: 'Active', lastActive: '10 phút trước' },
    { name: 'Ngọc Mai', email: 'mai.ngoc@lunara.vn', role: 'Lễ tân (Receptionist)', status: 'Active', lastActive: '1 giờ trước' },
    { name: 'Nguyễn Thị Linh', email: 'linh.nguyen@lunara.vn', role: 'Kỹ thuật viên', status: 'Active', lastActive: '2 giờ trước' },
  ];

  const permissionsConfig: Record<string, string[]> = {
    ADMIN: ['view_bookings', 'create_bookings', 'edit_bookings', 'view_customers', 'edit_customers', 'view_payments', 'refund_payments', 'view_reports', 'export_reports', 'manage_users', 'manage_roles'],
    MANAGER: ['view_bookings', 'create_bookings', 'edit_bookings', 'view_customers', 'edit_customers', 'view_payments', 'view_reports', 'export_reports', 'manage_users'],
    RECEPTIONIST: ['view_bookings', 'create_bookings', 'edit_bookings', 'view_customers', 'view_payments'],
    THERAPIST: ['view_bookings'],
  };

  const currentPerms = permissionsConfig[selectedRole] || [];

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Phân quyền & Tài khoản
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Thiết lập vai trò, quyền truy cập các module và phân bổ nhân sự
          </p>
        </div>

        <Button className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-11 px-5">
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Mời thành viên mới
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Tài khoản người dùng</TabsTrigger>
          <TabsTrigger value="roles">Ma trận phân quyền (RBAC Matrix)</TabsTrigger>
        </TabsList>

        {/* Tab 1: Users Table */}
        <TabsContent value="users">
          <Card className="overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8F9F5] border-b border-[#E2E8E3] text-[#6B726C] uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Thành viên</th>
                    <th className="py-3.5 px-6">Vai trò</th>
                    <th className="py-3.5 px-6">Trạng thái</th>
                    <th className="py-3.5 px-6">Hoạt động lần cuối</th>
                    <th className="py-3.5 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E3]">
                  {usersList.map((u, i) => (
                    <tr key={i} className="hover:bg-[#F8F9F5]/80 transition-colors">
                      <td className="py-4 px-6 font-semibold text-[#14271C]">
                        <div>{u.name}</div>
                        <div className="text-[11px] text-[#8EAA97]">{u.email}</div>
                      </td>
                      <td className="py-4 px-6 font-medium text-[#1E3B2B]">{u.role}</td>
                      <td className="py-4 px-6">
                        <Badge variant="success">● Đang hoạt động</Badge>
                      </td>
                      <td className="py-4 px-6 text-[#526056]">{u.lastActive}</td>
                      <td className="py-4 px-6 text-right">
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          Chỉnh sửa
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Permissions Matrix */}
        <TabsContent value="roles">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
            {/* Roles selector Left (4 cols) */}
            <Card className="md:col-span-4 p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8EAA97] px-2 block">
                Chọn vai trò để cấu hình:
              </span>
              {[
                { key: 'ADMIN', title: 'Chủ Spa (Administrator)', desc: 'Toàn quyền điều hành hệ thống' },
                { key: 'MANAGER', title: 'Quản Lý (Manager)', desc: 'Quản trị nhân viên & dịch vụ' },
                { key: 'RECEPTIONIST', title: 'Lễ Tân (Receptionist)', desc: 'Check-in, thu ngân, đặt lịch' },
                { key: 'THERAPIST', title: 'Kỹ Thuật Viên (Therapist)', desc: 'Nhận ca & xem lịch cá nhân' },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelectedRole(r.key as any)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer ${
                    selectedRole === r.key
                      ? 'bg-[#1E3B2B] text-white shadow-sm'
                      : 'hover:bg-[#F8F9F5] text-[#14271C]'
                  }`}
                >
                  <div className="font-semibold text-xs">{r.title}</div>
                  <div className={`text-[11px] mt-0.5 ${selectedRole === r.key ? 'text-[#D9E5DC]' : 'text-[#8EAA97]'}`}>
                    {r.desc}
                  </div>
                </button>
              ))}
            </Card>

            {/* Permissions Matrix Right (8 cols) */}
            <Card className="md:col-span-8 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-4">
                <div>
                  <h3 className="font-display font-semibold text-lg text-[#14271C]">
                    Quyền hạn của vai trò: {selectedRole}
                  </h3>
                  <p className="text-xs text-[#6B726C]">Các phân hệ và thao tác được phép truy cập</p>
                </div>

                <Button className="rounded-xl bg-[#1E3B2B] text-white text-xs h-9">
                  Lưu thiết lập quyền
                </Button>
              </div>

              {/* Grouped Checkboxes */}
              <div className="space-y-6 text-xs">
                {/* Bookings */}
                <div className="space-y-2">
                  <span className="font-bold uppercase tracking-wider text-[#1E3B2B] block">
                    1. Phân hệ Đặt lịch & Khách hàng
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8E3] bg-[#F8F9F5]">
                      <input type="checkbox" checked={currentPerms.includes('view_bookings')} readOnly className="rounded text-[#1E3B2B]" />
                      <span>Xem danh sách lịch hẹn</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8E3] bg-[#F8F9F5]">
                      <input type="checkbox" checked={currentPerms.includes('create_bookings')} readOnly className="rounded text-[#1E3B2B]" />
                      <span>Tạo & dời lịch hẹn</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8E3] bg-[#F8F9F5]">
                      <input type="checkbox" checked={currentPerms.includes('view_customers')} readOnly className="rounded text-[#1E3B2B]" />
                      <span>Xem hồ sơ & sở thích khách hàng</span>
                    </label>
                  </div>
                </div>

                {/* Financial & Reports */}
                <div className="space-y-2">
                  <span className="font-bold uppercase tracking-wider text-[#1E3B2B] block">
                    2. Phân hệ Tài chính & Báo cáo
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8E3] bg-[#F8F9F5]">
                      <input type="checkbox" checked={currentPerms.includes('view_payments')} readOnly className="rounded text-[#1E3B2B]" />
                      <span>Xem nhật ký giao dịch</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8E3] bg-[#F8F9F5]">
                      <input type="checkbox" checked={currentPerms.includes('refund_payments')} readOnly className="rounded text-[#1E3B2B]" />
                      <span>Thực hiện hoàn tiền (Refund)</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8E3] bg-[#F8F9F5]">
                      <input type="checkbox" checked={currentPerms.includes('view_reports')} readOnly className="rounded text-[#1E3B2B]" />
                      <span>Xem báo cáo doanh thu & biểu đồ</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8E3] bg-[#F8F9F5]">
                      <input type="checkbox" checked={currentPerms.includes('export_reports')} readOnly className="rounded text-[#1E3B2B]" />
                      <span>Xuất dữ liệu Excel/PDF</span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

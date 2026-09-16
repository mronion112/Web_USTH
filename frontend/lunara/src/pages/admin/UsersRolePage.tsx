import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  roleCode: 'ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'THERAPIST' | 'ACCOUNTANT';
  status: 'Active' | 'Inactive';
  lastActive: string;
}

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    name: 'Hoàng Thị Lan',
    email: 'lan.hoang@lunara.vn',
    role: 'Chủ Spa (Administrator)',
    roleCode: 'ADMIN',
    status: 'Active',
    lastActive: 'Vừa xong',
  },
  {
    id: 'usr-2',
    name: 'Trần Văn Minh',
    email: 'minh.tran@lunara.vn',
    role: 'Quản lý (Manager)',
    roleCode: 'MANAGER',
    status: 'Active',
    lastActive: '10 phút trước',
  },
  {
    id: 'usr-3',
    name: 'Ngọc Mai',
    email: 'mai.ngoc@lunara.vn',
    role: 'Lễ tân (Receptionist)',
    roleCode: 'RECEPTIONIST',
    status: 'Active',
    lastActive: '1 giờ trước',
  },
  {
    id: 'usr-4',
    name: 'Nguyễn Thị Linh',
    email: 'linh.nguyen@lunara.vn',
    role: 'Kỹ thuật viên (Therapist)',
    roleCode: 'THERAPIST',
    status: 'Active',
    lastActive: '2 giờ trước',
  },
  {
    id: 'usr-5',
    name: 'Lê Thu Thảo',
    email: 'thao.le@lunara.vn',
    role: 'Kế toán (Accountant)',
    roleCode: 'ACCOUNTANT',
    status: 'Active',
    lastActive: 'Hôm qua',
  },
];

const INITIAL_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'view_bookings',
    'create_bookings',
    'edit_bookings',
    'view_customers',
    'edit_customers',
    'view_payments',
    'refund_payments',
    'view_reports',
    'export_reports',
    'manage_users',
    'manage_roles',
  ],
  MANAGER: [
    'view_bookings',
    'create_bookings',
    'edit_bookings',
    'view_customers',
    'edit_customers',
    'view_payments',
    'view_reports',
    'export_reports',
    'manage_users',
  ],
  RECEPTIONIST: [
    'view_bookings',
    'create_bookings',
    'edit_bookings',
    'view_customers',
    'view_payments',
  ],
  THERAPIST: ['view_bookings'],
  ACCOUNTANT: ['view_payments', 'view_reports', 'export_reports'],
};

export const UsersRolePage: React.FC = () => {
  const [usersList, setUsersList] = useState<UserAccount[]>(INITIAL_USERS);
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'THERAPIST' | 'ACCOUNTANT'>('MANAGER');
  const [permissions, setPermissions] = useState<Record<string, string[]>>(INITIAL_PERMISSIONS);

  // Modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states for Invite
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleCode, setInviteRoleCode] = useState<'ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'THERAPIST' | 'ACCOUNTANT'>('RECEPTIONIST');

  // Form states for Edit
  const [editName, setEditName] = useState('');
  const [editRoleCode, setEditRoleCode] = useState<'ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'THERAPIST' | 'ACCOUNTANT'>('RECEPTIONIST');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');

  const getRoleLabel = (code: string) => {
    switch (code) {
      case 'ADMIN': return 'Chủ Spa (Administrator)';
      case 'MANAGER': return 'Quản lý (Manager)';
      case 'RECEPTIONIST': return 'Lễ tân (Receptionist)';
      case 'THERAPIST': return 'Kỹ thuật viên (Therapist)';
      case 'ACCOUNTANT': return 'Kế toán (Accountant)';
      default: return code;
    }
  };

  const handleOpenEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditRoleCode(user.roleCode);
    setEditStatus(user.status);
    setEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              name: editName,
              roleCode: editRoleCode,
              role: getRoleLabel(editRoleCode),
              status: editStatus,
            }
          : u
      )
    );

    setEditModalOpen(false);
    setSuccessMsg(`Đã cập nhật thông tin thành viên: ${editName}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setUsersList((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setEditModalOpen(false);
    setSuccessMsg(`Đã xóa tài khoản: ${selectedUser.name}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: getRoleLabel(inviteRoleCode),
      roleCode: inviteRoleCode,
      status: 'Active',
      lastActive: 'Vừa xong',
    };

    setUsersList([...usersList, newUser]);
    setInviteModalOpen(false);
    setSuccessMsg(`Đã gửi lời mời tham gia quản trị thành công đến ${inviteEmail}`);
    setTimeout(() => setSuccessMsg(''), 4000);

    setInviteName('');
    setInviteEmail('');
  };

  const togglePermission = (perm: string) => {
    const current = permissions[selectedRole] || [];
    const updated = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];

    setPermissions({
      ...permissions,
      [selectedRole]: updated,
    });
  };

  const handleSavePermissions = () => {
    setSuccessMsg(`Đã lưu cấu hình ma trận phân quyền cho vai trò ${selectedRole}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const currentPerms = permissions[selectedRole] || [];

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Phân quyền & Tài khoản
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Thiết lập vai trò, quyền truy cập các module và phân bổ nhân sự ({usersList.length} tài khoản)
          </p>
        </div>

        <Button
          onClick={() => setInviteModalOpen(true)}
          className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-11 px-5 shadow-luxury cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Mời thành viên mới
        </Button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20 p-3.5 text-xs text-[#1E3B2B] font-medium flex items-center justify-between animate-in fade-in">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-[#2E7D32] hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F8F9F5]/80 transition-colors">
                      <td className="py-4 px-6 font-semibold text-[#14271C]">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#E8F5E9] text-[#1E3B2B] font-bold flex items-center justify-center">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div>{u.name}</div>
                            <div className="text-[11px] text-[#8EAA97] font-normal">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-[#1E3B2B]">{u.role}</td>
                      <td className="py-4 px-6">
                        <Badge variant={u.status === 'Active' ? 'success' : 'outline'}>
                          {u.status === 'Active' ? '● Đang hoạt động' : '○ Tạm khóa'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-[#526056]">{u.lastActive}</td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(u)}
                          className="h-8 text-xs cursor-pointer hover:border-[#1E3B2B]"
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1 text-[#8EAA97]" />
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
                { key: 'ACCOUNTANT', title: 'Kế Toán (Accountant)', desc: 'Đối soát hóa đơn & xem báo cáo' },
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
                  <div
                    className={`text-[11px] mt-0.5 ${
                      selectedRole === r.key ? 'text-[#D9E5DC]' : 'text-[#8EAA97]'
                    }`}
                  >
                    {r.desc}
                  </div>
                </button>
              ))}
            </Card>

            {/* Permissions Matrix Right (8 cols) */}
            <Card className="md:col-span-8 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8E3] pb-4">
                <div>
                  <h3 className="font-display font-semibold text-lg text-[#14271C]">
                    Quyền hạn của vai trò: {selectedRole}
                  </h3>
                  <p className="text-xs text-[#6B726C]">Các phân hệ và thao tác được phép truy cập</p>
                </div>

                <Button
                  onClick={handleSavePermissions}
                  className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-9 px-4 font-semibold"
                >
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
                    {[
                      { key: 'view_bookings', label: 'Xem danh sách lịch hẹn' },
                      { key: 'create_bookings', label: 'Tạo & dời lịch hẹn' },
                      { key: 'edit_bookings', label: 'Chỉnh sửa trạng thái ca phục vụ' },
                      { key: 'view_customers', label: 'Xem hồ sơ & thông tin khách hàng' },
                      { key: 'edit_customers', label: 'Cập nhật ghi chú nội bộ khách hàng' },
                    ].map((p) => (
                      <label
                        key={p.key}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8E3] bg-[#F8F9F5] cursor-pointer hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={currentPerms.includes(p.key)}
                          onChange={() => togglePermission(p.key)}
                          className="rounded text-[#1E3B2B]"
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Financial & Reports */}
                <div className="space-y-2">
                  <span className="font-bold uppercase tracking-wider text-[#1E3B2B] block">
                    2. Phân hệ Tài chính & Báo cáo
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'view_payments', label: 'Xem nhật ký giao dịch VietQR' },
                      { key: 'refund_payments', label: 'Thực hiện hoàn tiền (Refund)' },
                      { key: 'view_reports', label: 'Xem báo cáo doanh thu & biểu đồ' },
                      { key: 'export_reports', label: 'Xuất dữ liệu sao kê Excel/PDF' },
                    ].map((p) => (
                      <label
                        key={p.key}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8E3] bg-[#F8F9F5] cursor-pointer hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={currentPerms.includes(p.key)}
                          onChange={() => togglePermission(p.key)}
                          className="rounded text-[#1E3B2B]"
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* System & Users */}
                <div className="space-y-2">
                  <span className="font-bold uppercase tracking-wider text-[#1E3B2B] block">
                    3. Quản trị Kỹ thuật viên & Cấu hình
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'manage_users', label: 'Mời và chỉnh sửa tài khoản thành viên' },
                      { key: 'manage_roles', label: 'Cấu hình ma trận phân quyền RBAC' },
                    ].map((p) => (
                      <label
                        key={p.key}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8E3] bg-[#F8F9F5] cursor-pointer hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={currentPerms.includes(p.key)}
                          onChange={() => togglePermission(p.key)}
                          className="rounded text-[#1E3B2B]"
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Mời Thành Viên Mới */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <form onSubmit={handleInviteUser} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Mời thành viên mới vào hệ thống</DialogTitle>
            <DialogDescription>
              Tài khoản sẽ nhận quyền quản trị tương ứng và đăng nhập bằng Google Workspace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Họ và tên thành viên *</Label>
              <Input
                required
                placeholder="Ví dụ: Đỗ Gia Hưng"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label>Email Google *</Label>
              <Input
                required
                type="email"
                placeholder="giahung@lunara.vn"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label>Vai trò gán *</Label>
              <select
                value={inviteRoleCode}
                onChange={(e) => setInviteRoleCode(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs font-medium text-[#14271C]"
              >
                <option value="ADMIN">Chủ Spa (Administrator)</option>
                <option value="MANAGER">Quản lý (Manager)</option>
                <option value="RECEPTIONIST">Lễ tân (Receptionist)</option>
                <option value="THERAPIST">Kỹ thuật viên (Therapist)</option>
                <option value="ACCOUNTANT">Kế toán (Accountant)</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInviteModalOpen(false)}
              className="text-xs h-10"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4 font-semibold"
            >
              Gửi lời mời
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modal Chỉnh Sửa Thành Viên */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        {selectedUser && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa thành viên: {selectedUser.name}</DialogTitle>
              <DialogDescription>
                Cập nhật vai trò phân quyền hoặc trạng thái hoạt động của tài khoản
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label>Họ và tên</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  value={selectedUser.email}
                  disabled
                  className="h-10 text-xs bg-[#F8F9F5] text-[#6B726C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Vai trò</Label>
                  <select
                    value={editRoleCode}
                    onChange={(e) => setEditRoleCode(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs font-medium text-[#14271C]"
                  >
                    <option value="ADMIN">Chủ Spa (Administrator)</option>
                    <option value="MANAGER">Quản lý (Manager)</option>
                    <option value="RECEPTIONIST">Lễ tân (Receptionist)</option>
                    <option value="THERAPIST">Kỹ thuật viên (Therapist)</option>
                    <option value="ACCOUNTANT">Kế toán (Accountant)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label>Trạng thái tài khoản</Label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs font-medium text-[#14271C]"
                  >
                    <option value="Active">Đang hoạt động (Active)</option>
                    <option value="Inactive">Tạm vô hiệu hóa (Inactive)</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between items-center w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteUser}
                className="text-red-700 hover:bg-red-50 text-xs h-10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa tài khoản
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  className="text-xs h-10"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4 font-semibold"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </div>
  );
};

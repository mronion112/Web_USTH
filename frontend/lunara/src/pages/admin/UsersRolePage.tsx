import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit2, Power, Shield } from 'lucide-react';
import { accountsApi, ApiAccount } from '@/lib/api';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Chủ Spa (Owner)',
  ADMIN: 'Chủ Spa (Administrator)',
  MANAGER: 'Quản lý (Manager)',
  RECEPTIONIST: 'Lễ tân (Receptionist)',
  THERAPIST: 'Kỹ thuật viên (Therapist)',
  ACCOUNTANT: 'Kế toán (Accountant)',
  CUSTOMER: 'Khách hàng (Customer)',
};

export const UsersRolePage: React.FC = () => {
  const [usersList, setUsersList] = useState<ApiAccount[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('MANAGER');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiAccount | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states for Invite
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleCode, setInviteRoleCode] = useState<string>('RECEPTIONIST');

  // Form states for Edit
  const [editRoleCode, setEditRoleCode] = useState<string>('RECEPTIONIST');

  const reloadAccounts = useCallback(async () => {
    try {
      const data = await accountsApi.getAll();
      if (Array.isArray(data)) {
        setUsersList(data);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadAccounts();
  }, [reloadAccounts]);

  const handleOpenEdit = (user: ApiAccount) => {
    setSelectedUser(user);
    setEditRoleCode(user.role);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await accountsApi.updateRole(selectedUser.id, editRoleCode);
      await reloadAccounts();
      setEditModalOpen(false);
      setSuccessMsg(`Đã cập nhật vai trò tài khoản: ${selectedUser.displayName}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật vai trò');
    }
  };

  const handleToggleActive = async (user: ApiAccount) => {
    try {
      await accountsApi.toggleActive(user.id);
      await reloadAccounts();
      setSuccessMsg(`Đã đổi trạng thái tài khoản ${user.displayName}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đổi trạng thái');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    try {
      await accountsApi.create({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRoleCode,
      });

      await reloadAccounts();
      setInviteModalOpen(false);
      setSuccessMsg(`Đã tạo thành công tài khoản cho ${inviteName}`);
      setTimeout(() => setSuccessMsg(''), 4000);

      // Reset form
      setInviteName('');
      setInviteEmail('');
      setInviteRoleCode('RECEPTIONIST');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo tài khoản');
    }
  };


  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Tài khoản & Phân quyền
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Quản lý tài khoản nhân sự và vai trò truy cập ({usersList.length} tài khoản trong hệ thống)
          </p>
        </div>

        <Button
          onClick={() => setInviteModalOpen(true)}
          className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-11 px-5 shadow-luxury cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Thêm tài khoản nhân sự
        </Button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20 p-3.5 text-xs text-[#1E3B2B] font-medium animate-in fade-in">
          ✓ {successMsg}
        </div>
      )}

      {/* Tabs Layout */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-[#FAFBF9] border border-[#E2E8E3] p-1 rounded-xl">
          <TabsTrigger value="users" className="text-xs font-semibold rounded-lg">
            Danh sách tài khoản ({usersList.length})
          </TabsTrigger>
          <TabsTrigger value="roles" className="text-xs font-semibold rounded-lg">
            Cấu hình phân quyền vai trò
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Danh sách người dùng */}
        <TabsContent value="users" className="space-y-4">
          <Card className="overflow-hidden border border-[#E2E8E3] shadow-luxury">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8E3] bg-[#FAFBF9] text-[#718276] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-6">ID</th>
                    <th className="py-3 px-6">Nhân sự / Tài khoản</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Vai trò (Role)</th>
                    <th className="py-3 px-6">Trạng thái</th>
                    <th className="py-3 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E3]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#8EAA97]">
                        Đang tải danh sách tài khoản từ database...
                      </td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#8EAA97]">
                        Không có tài khoản nào
                      </td>
                    </tr>
                  ) : (
                    usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-[#FAFBF9] transition-colors">
                        <td className="py-4 px-6 text-[#8EAA97]">#{user.id}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#E8F5E9] text-[#1E3B2B] flex items-center justify-center font-bold text-xs">
                              {user.displayName.charAt(0)}
                            </div>
                            <span className="font-semibold text-[#14271C]">{user.displayName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[#526056]">{user.email}</td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 font-semibold text-[#1E3B2B] bg-[#E8F5E9] px-2.5 py-1 rounded-md text-[11px]">
                            <Shield className="h-3 w-3 text-[#2E7D32]" />
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={user.isActive ? 'success' : 'outline'}>
                            {user.isActive ? '● Đang hoạt động' : '○ Tạm khóa'}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(user)}
                              title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              className="h-8 text-xs cursor-pointer"
                            >
                              <Power className={`h-3.5 w-3.5 ${user.isActive ? 'text-[#BA1A1A]' : 'text-[#2E7D32]'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(user)}
                              className="h-8 text-xs text-[#1E3B2B] hover:bg-[#E8F0EA] cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              Đổi vai trò
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Cấu hình phân quyền */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Left: Roles list */}
            <Card className="p-3 space-y-1.5 border border-[#E2E8E3] shadow-luxury">
              {['OWNER', 'MANAGER', 'RECEPTIONIST', 'THERAPIST', 'ACCOUNTANT'].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                    selectedRole === r
                      ? 'bg-[#1E3B2B] text-white'
                      : 'hover:bg-[#FAFBF9] text-[#14271C]'
                  }`}
                >
                  <span>{ROLE_LABELS[r] || r}</span>
                  <span className="text-[10px] opacity-70">
                    {usersList.filter((u) => u.role === r).length} người
                  </span>
                </button>
              ))}
            </Card>

            {/* Right: Permissions display */}
            <Card className="md:col-span-3 p-6 space-y-4 border border-[#E2E8E3] shadow-luxury">
              <div>
                <h3 className="font-display font-semibold text-base text-[#14271C]">
                  Quyền hạn cho vai trò: {ROLE_LABELS[selectedRole] || selectedRole}
                </h3>
                <p className="text-xs text-[#6B726C] mt-0.5">
                  Phân quyền được đồng bộ trực tiếp từ bảng role_permissions của cơ sở dữ liệu.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { name: 'Quản lý lịch hẹn (Xem, Check-in, Phân KTV)', active: ['OWNER', 'MANAGER', 'RECEPTIONIST'].includes(selectedRole) },
                  { name: 'Khởi tạo và chỉnh sửa Dịch vụ Spa', active: ['OWNER', 'MANAGER'].includes(selectedRole) },
                  { name: 'Đối soát & Hoàn tiền giao dịch', active: ['OWNER', 'MANAGER', 'ACCOUNTANT'].includes(selectedRole) },
                  { name: 'Xem báo cáo doanh thu & CSAT', active: ['OWNER', 'MANAGER', 'ACCOUNTANT'].includes(selectedRole) },
                  { name: 'Bắt đầu & Hoàn thành ca phục vụ', active: ['OWNER', 'MANAGER', 'THERAPIST'].includes(selectedRole) },
                  { name: 'Quản lý tài khoản & phân quyền hệ thống', active: ['OWNER', 'MANAGER'].includes(selectedRole) },
                  { name: 'Xem & lưu hồ sơ ghi chú khách hàng', active: ['OWNER', 'MANAGER', 'RECEPTIONIST'].includes(selectedRole) },
                  { name: 'Cấu hình ca làm việc & nghỉ phép KTV', active: ['OWNER', 'MANAGER'].includes(selectedRole) },
                ].map((perm, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                      perm.active
                        ? 'bg-[#E8F5E9]/50 border-[#2E7D32]/30 text-[#1E3B2B]'
                        : 'bg-[#FAFBF9] border-[#E2E8E3] text-[#8EAA97]'
                    }`}
                  >
                    <span className="font-medium">{perm.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${perm.active ? 'bg-[#2E7D32] text-white' : 'bg-[#E2E8E3] text-[#526056]'}`}>
                      {perm.active ? 'ĐƯỢC PHÉP' : 'KHÔNG'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Role Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 font-body">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-luxury border border-[#E2E8E3] animate-in fade-in zoom-in-95 space-y-4">
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-[#14271C]">
                  Cập nhật vai trò nhân sự
                </DialogTitle>
                <DialogDescription className="text-xs text-[#6B726C]">
                  Thay đổi phân quyền truy cập cho {selectedUser.displayName} ({selectedUser.email})
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveEdit} className="space-y-4 my-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Vai trò mới trong hệ thống</Label>
                  <select
                    value={editRoleCode}
                    onChange={(e) => setEditRoleCode(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-[#E2E8E3] rounded-xl focus:ring-[#1E3B2B]"
                  >
                    <option value="OWNER">Chủ Spa (Owner)</option>
                    <option value="MANAGER">Quản lý (Manager)</option>
                    <option value="RECEPTIONIST">Lễ tân (Receptionist)</option>
                    <option value="THERAPIST">Kỹ thuật viên (Therapist)</option>
                    <option value="ACCOUNTANT">Kế toán (Accountant)</option>
                    <option value="CUSTOMER">Khách hàng (Customer)</option>
                  </select>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditModalOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold"
                  >
                    Lưu vai trò
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </div>
        )}
      </Dialog>

      {/* Add / Invite User Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 font-body">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-luxury border border-[#E2E8E3] animate-in fade-in zoom-in-95 space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-[#14271C]">
                Thêm tài khoản nhân sự
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B726C]">
                Khởi tạo tài khoản hệ thống mới và gán vai trò ban đầu.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 my-2">
              <div className="space-y-1">
                <Label className="text-xs">Họ và tên nhân sự *</Label>
                <Input
                  placeholder="VD: Nguyễn Thị Thảo..."
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Email đăng nhập *</Label>
                <Input
                  type="email"
                  placeholder="thao.nguyen@lunara.vn"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Vai trò</Label>
                <select
                  value={inviteRoleCode}
                  onChange={(e) => setInviteRoleCode(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-white border border-[#E2E8E3] rounded-xl focus:ring-[#1E3B2B]"
                >
                  <option value="THERAPIST">Kỹ thuật viên (Therapist)</option>
                  <option value="RECEPTIONIST">Lễ tân (Receptionist)</option>
                  <option value="MANAGER">Quản lý (Manager)</option>
                  <option value="ACCOUNTANT">Kế toán (Accountant)</option>
                  <option value="OWNER">Chủ Spa (Owner)</option>
                </select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold"
                >
                  Tạo tài khoản
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

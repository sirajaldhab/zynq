import React, { useMemo, useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonToast, IonButton, IonIcon } from '@ionic/react';
import Nav from '../components/Nav';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Table, { Column } from '../ui/Table';
import Pagination from '../ui/Pagination';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { chevronBackOutline } from 'ionicons/icons';
import { toCsv, downloadCsv, CsvColumn } from '../utils/csv';
import { useQueryParam } from '../hooks/useQueryParam';
import { useAuth } from '../auth/AuthContext';
import { fetchUsers, fetchRoles, updateUser, createUser, deleteUser, fetchPendingUsers, approveUser, rejectUser, UserDto, RoleDto } from '../api/usersService';

type Role = { id: string; name: string; permissions?: number };

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string;
  status: string; // ACTIVE | INACTIVE | PENDING
  createdAt?: string;
};

// No mock roles/users; all data must come from the live API

function prettifyRole(name: string) {
  return (name || '').toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}
function RoleBadge({ name }: { name: string }) {
  const key = (name || '').toUpperCase();
  const map: Record<string, string> = {
    ADMIN: 'bg-purple-500/10 text-purple-400',
    MANAGER: 'bg-blue-500/10 text-blue-400',
    STAFF: 'bg-emerald-500/10 text-emerald-400',
    VIEWER: 'bg-slate-500/10 text-slate-400',
    HR_MANAGER: 'bg-pink-500/10 text-pink-400',
    FINANCE_MANAGER: 'bg-amber-500/10 text-amber-500',
    ACCOUNTANT: 'bg-indigo-500/10 text-indigo-400',
    EMPLOYEE: 'bg-slate-500/10 text-slate-400',
  };
  const klass = map[key] || 'bg-slate-500/10 text-slate-400';
  return <span className={`px-2 py-0.5 rounded-full text-xs ${klass}`}>{prettifyRole(name)}</span>;
}

function toUiStatus(s: string) {
  // Show exact backend status string as required
  return (s || '').toString();
}
function toApiStatus(s: string) {
  const u = (s || '').toLowerCase();
  if (u.startsWith('active')) return 'ACTIVE';
  if (u.startsWith('inactive')) return 'INACTIVE';
  if (u.startsWith('pending')) return 'PENDING_APPROVAL';
  if (u.startsWith('rejected')) return 'REJECTED';
  return s || '';
}

export default function Admin() {
  const [present] = useIonToast();
  const navigate = useNavigate();
  const { role } = useAuth();
  const upperRole = (role || '').toUpperCase();
  const isGM = upperRole === 'GM';
  const isAdmin = upperRole === 'ADMIN';
  useEffect(() => {
    console.log('Loaded Admin > Overview page');
  }, []);
  // Users state
  const [userSearch, setUserSearch] = useQueryParam<string>('userQ', '');
  const [userRole, setUserRole] = useQueryParam<'All' | string>('userRole', 'All');
  const [userStatus, setUserStatus] = useQueryParam<'All' | string>('userStatus', 'All');
  const [userPage, setUserPage] = useQueryParam<number>('userPage', 1);
  const userPageSize = 8;
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState<number>(0);

  // Pending Requests
  const [pendingPage, setPendingPage] = useQueryParam<number>('pendingPage', 1);
  const pendingPageSize = 8;
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pendingTotal, setPendingTotal] = useState<number>(0);
  const [pendingRoleMap, setPendingRoleMap] = useState<Record<string, string>>({});

  // Roles state
  const [rolePage, setRolePage] = useQueryParam<number>('rolePage', 1);
  const rolePageSize = 8;
  const [viewRole, setViewRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesTotal, setRolesTotal] = useState<number>(0);

  const filteredRoles = React.useMemo(
    () => roles.filter((r) => {
      const n = (r.name || '').toUpperCase();
      return !['ADMIN', 'STAFF', 'EMPLOYEE', 'MANAGER'].includes(n);
    }),
    [roles],
  );

  React.useEffect(() => {
    const token = localStorage.getItem('accessToken') || undefined;
    (async () => {
      try {
        const res = await fetchUsers({
          search: userSearch,
          role: userRole,
          status: userStatus,
          page: userPage,
          pageSize: userPageSize,
          token,
        });
        const mapped: User[] = res.data.map((u: UserDto) => ({ id: (u as any).id, name: (u as any).name, email: (u as any).email, role: (u as any).role?.name || (u as any).role || '', roleId: (u as any).role?.id, status: (u as any).status, createdAt: (u as any).createdAt }));
        setUsers(mapped);
        setUsersTotal(res.total || mapped.length);
      } catch (_) {
        present({ message: 'Failed to load users.', color: 'danger', duration: 2000, position: 'top' });
        setUsers([]);
        setUsersTotal(0);
      }
    })();
  }, [userSearch, userRole, userStatus, userPage]);

  async function handleResetPasswordSubmit() {
    if (!resetUser || !resetPassword) return;
    setResetSubmitting(true);
    const token = localStorage.getItem('accessToken') || undefined;
    try {
      await updateUser(resetUser.id, { password: resetPassword }, token);
      present({ message: 'Password reset successfully.', color: 'success', duration: 1500, position: 'top' });
      setResetUser(null);
      setResetPassword('');
    } catch {
      present({ message: 'Failed to reset password.', color: 'danger', duration: 2000, position: 'top' });
    } finally {
      setResetSubmitting(false);
    }
  }

  // Load pending users
  React.useEffect(() => {
    const token = localStorage.getItem('accessToken') || undefined;
    (async () => {
      try {
        const res = await fetchPendingUsers({ page: pendingPage, pageSize: pendingPageSize, token });
        const mapped: User[] = res.data.map((u: UserDto) => ({ id: (u as any).id, name: (u as any).name, email: (u as any).email, role: (u as any).role?.name || (u as any).role || '', roleId: (u as any).role?.id, status: (u as any).status, createdAt: (u as any).createdAt }));
        setPendingUsers(mapped);
        // initialize role selection map
        const nextMap: Record<string, string> = {};
        mapped.forEach((u) => { if (u.roleId) nextMap[u.id] = u.roleId; });
        setPendingRoleMap(nextMap);
        setPendingTotal(res.total || mapped.length);
      } catch (_) {
        setPendingUsers([]);
        setPendingRoleMap({});
        setPendingTotal(0);
      }
    })();
  }, [pendingPage]);

  React.useEffect(() => {
    const token = localStorage.getItem('accessToken') || undefined;
    (async () => {
      try {
        const res = await fetchRoles({ page: rolePage, pageSize: rolePageSize, token });
        const mapped: Role[] = (res as any[]).map((r: any) => ({ id: r.id, name: r.name, permissions: r.permissions ?? 0 }));
        setRoles(mapped);
        setRolesTotal(mapped.length);
      } catch (_) {
        present({ message: 'Failed to load roles.', color: 'danger', duration: 2000, position: 'top' });
        setRoles([]);
        setRolesTotal(0);
      }
    })();
  }, [rolePage]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return users
      .filter((u) =>
        (userRole === 'All' || (u.roleId || '') === (userRole || '')) &&
        (userStatus === 'All' || (u.status || '').toUpperCase() === toApiStatus(userStatus)) &&
        (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      )
      .filter((u) => (u.role || '').toUpperCase() !== 'ADMIN');
  }, [users, userSearch, userRole, userStatus]);

  function exportUsersCsv() {
    const cols: CsvColumn<User>[] = [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'role', header: 'Role', map: (r) => prettifyRole(r.role) },
      { key: 'status', header: 'Status', map: (r) => toUiStatus(r.status) },
    ];
    downloadCsv('users.csv', toCsv(filteredUsers, cols));
  }

  function exportRolesCsv() {
    const cols: CsvColumn<Role>[] = [
      { key: 'name', header: 'Role' },
      { key: 'permissions', header: 'Permissions' },
    ];
    downloadCsv('roles.csv', toCsv(roles, cols));
  }

  const usersColumns: Column<User>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (r) => <RoleBadge name={r.role} /> },
    { key: 'status', header: 'Status', render: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-xs ${toApiStatus(r.status) === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : toApiStatus(r.status) === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : toApiStatus(r.status) === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-400'}`}>{toUiStatus(r.status)}</span>
    ) },
    { key: 'actions', header: 'Actions', render: (r) => (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setViewUser(r)}>View</Button>
        <Button size="sm" variant="secondary" onClick={() => setEditUser(r)}>Edit</Button>
        {(toApiStatus(r.status) === 'ACTIVE' || !isGM) && (
          <Button
            size="sm"
            variant={toApiStatus(r.status) === 'ACTIVE' ? 'danger' : 'secondary'}
            onClick={() => handleToggleUserActive(r)}
          >
            {toApiStatus(r.status) === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        )}
        {toApiStatus(r.status) === 'PENDING' && (
          <>
            <Button size="sm" onClick={() => handleApprove(r)}>Approve</Button>
            <Button size="sm" variant="danger" onClick={() => handleReject(r)}>Reject</Button>
          </>
        )}
        {isAdmin && (
          <Button size="sm" variant="secondary" onClick={() => {
            setResetUser(r);
            setResetPassword('');
          }}>
            Reset Password
          </Button>
        )}
        {!isGM && (
          <Button size="sm" variant="danger" onClick={() => handleDelete(r)}>Delete</Button>
        )}
      </div>
    ) },
  ];

  const rolesColumns: Column<Role>[] = [
    { key: 'name', header: 'Role', render: (r) => <RoleBadge name={r.name} /> },
    { key: 'permissions', header: 'Permissions' },
    { key: 'actions', header: 'Actions', render: (r) => (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setViewRole(r)}>View</Button>
        <Button size="sm" variant="secondary">Edit</Button>
      </div>
    ) },
  ];

  // Include pending users also in the main Users table view (with their current status)
  const viewUsers = useMemo(() => {
    const pendingIds = new Set(pendingUsers.map((u) => u.id));
    // Merge filtered active users with pending ones, avoiding duplicates
    const merged = [
      ...filteredUsers,
      ...pendingUsers.filter((u) => !pendingIds.has(u.id)),
    ];
    return merged;
  }, [filteredUsers, pendingUsers]);
  const viewRoles = roles;

  async function handleToggleUserActive(row: User) {
    const nextStatus: string = toApiStatus(row.status) === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const prev = users.slice();
    setUsers((list) => list.map((u) => (u.id === row.id ? { ...u, status: nextStatus } : u)));
    try {
      const token = localStorage.getItem('accessToken') || undefined;
      await updateUser(row.id, { status: nextStatus }, token);
      present({ message: `User ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`, color: 'success', duration: 1500, position: 'top' });
    } catch (e) {
      setUsers(prev);
      present({ message: 'Failed to update user status.', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function handleApprove(row: User) {
    const prevPending = pendingUsers.slice();
    setPendingUsers((list) => list.filter((u) => u.id !== row.id));
    const roleId = pendingRoleMap[row.id] || row.roleId;
    try {
      const token = localStorage.getItem('accessToken') || undefined;
      await approveUser(row.id, roleId ? { roleId } : {}, token);
      // Move to users as ACTIVE
      const approved: User = { ...row, status: 'ACTIVE', roleId, role: roles.find(r => r.id === roleId)?.name || row.role };
      setUsers((list) => [approved, ...list]);
      setUsersTotal((t) => t + 1);
      present({ message: 'User approved.', color: 'success', duration: 1500, position: 'top' });
    } catch {
      setPendingUsers(prevPending);
      present({ message: 'Failed to approve user.', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function handleReject(row: User) {
    const prevPending = pendingUsers.slice();
    setPendingUsers((list) => list.filter((u) => u.id !== row.id));
    try {
      const token = localStorage.getItem('accessToken') || undefined;
      await rejectUser(row.id, token);
      present({ message: 'User rejected.', color: 'success', duration: 1500, position: 'top' });
    } catch {
      setPendingUsers(prevPending);
      present({ message: 'Failed to reject user.', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function handleDelete(row: User) {
    const prev = users.slice();
    setUsers((list) => list.filter((u) => u.id !== row.id));
    setUsersTotal((t) => Math.max(0, t - 1));
    try {
      const token = localStorage.getItem('accessToken') || undefined;
      await deleteUser(row.id, token);
      present({ message: 'User deleted.', color: 'success', duration: 1500, position: 'top' });
    } catch {
      setUsers(prev);
      setUsersTotal(prev.length);
      present({ message: 'Failed to delete user.', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  function resetUserFilters() {
    setUserSearch('');
    setUserRole('All');
    setUserStatus('All');
    setUserPage(1);
  }

  function resetRoleFilters() {
    setRolePage(1);
  }

  // Add User Modal
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRoleId, setAddRoleId] = useState<string>('');

  // Edit User state for role assignment
  const [editRoleId, setEditRoleId] = useState<string>('');
  useEffect(() => {
    if (editUser) {
      const r = roles.find((x) => (x.name || '').toUpperCase() === (editUser.role || '').toUpperCase());
      setEditRoleId(r?.id || '');
    } else {
      setEditRoleId('');
    }
  }, [editUser, roles]);

  async function handleEditSave() {
    if (!editUser) return;
    const token = localStorage.getItem('accessToken') || undefined;
    try {
      const body: any = { name: editUser.name, email: editUser.email };
      if (editRoleId) body.roleId = editRoleId;
      const updated = await updateUser(editUser.id, body, token) as any;
      setUsers((list) => list.map((u) => (u.id === editUser.id ? {
        ...u,
        name: updated.name ?? editUser.name,
        email: updated.email ?? editUser.email,
        role: updated.role?.name || updated.role || editUser.role,
      } : u)));
      setEditUser(null);
      present({ message: 'User updated.', color: 'success', duration: 1500, position: 'top' });
    } catch {
      present({ message: 'Failed to update user.', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function handleCreateUser() {
    if (!addEmail || !addName || !addRoleId) return;
    const token = localStorage.getItem('accessToken') || undefined;
    try {
      const res = await createUser({ email: addEmail, name: addName, password: addPassword || undefined, roleId: addRoleId, status: 'ACTIVE' }, token);
      setAddOpen(false);
      setAddName(''); setAddEmail(''); setAddPassword(''); setAddRoleId('');
      // refresh list
      setUserPage(1);
      present({ message: 'User created.', color: 'success', duration: 1500, position: 'top' });
      // Optimistically insert
      setUsers((list) => [{ id: (res as any).id, name: (res as any).name, email: (res as any).email, role: (res as any).role?.name || (res as any).role || '', status: (res as any).status || 'ACTIVE' }, ...list]);
      setUsersTotal((t) => t + 1);
    } catch (e: any) {
      present({ message: e?.message || 'Failed to create user.', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="px-4 py-6 sm:px-6 lg:px-8 bg-[color:var(--bg)] space-y-6">
        <div className="mx-auto w-full max-w-screen-md lg:max-w-none space-y-6">
          <div className="text-lg font-semibold hidden lg:block">Admin</div>
          <div className="zynq-muted text-sm hidden lg:block">Home &gt; Admin</div>
          {!isGM && (
            <div className="hidden lg:block">
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 flex items-center gap-2"
                onClick={() => navigate('/')}
              >
                <IonIcon icon={chevronBackOutline} />
                <span>Back</span>
              </Button>
            </div>
          )}
          {!isGM && (
            <div className="flex flex-wrap gap-2 mt-2">
              <IonButton size="small" color="medium" routerLink="/admin/users">Users</IonButton>
              <IonButton size="small" color="medium" routerLink="/admin/roles">Roles &amp; Permissions</IonButton>
              <IonButton size="small" color="medium" routerLink="/admin/settings">App Settings</IonButton>
              <IonButton size="small" color="medium" routerLink="/admin/logs">System Logs</IonButton>
              <IonButton size="small" color="medium" routerLink="/admin/sync">Sync Status</IonButton>
              <IonButton size="small" color="medium" routerLink="/admin/backup">Backup</IonButton>
            </div>
          )}

        {/* Users management card: visible for GM and admins */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={resetUserFilters}>Reset Filters</Button>
              {!isGM && (
                <Button size="sm" onClick={() => setAddOpen(true)}>Add User</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
              <Input label="Search" placeholder="Name or email" value={userSearch} onChange={(e) => setUserSearch((e.target as HTMLInputElement).value)} />
              <Select label="Role" value={userRole} onChange={(e) => setUserRole(e.target.value as any)}>
                <option value="All">All</option>
                {roles
                  .filter((r) => ['GM', 'TEAM LEADER'].includes((r.name || '').toUpperCase()))
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {prettifyRole(r.name)}
                    </option>
                  ))}
              </Select>
              <Select label="Status" value={userStatus} onChange={(e) => setUserStatus(e.target.value as any)}>
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Inactive">Inactive</option>
              </Select>
              {!isGM && (
                <div className="flex items-end">
                  <Button onClick={() => setAddOpen(true)}>Add User</Button>
                </div>
              )}
            </div>
            <Table columns={usersColumns} data={viewUsers} emptyText="No users" />
            <Pagination page={userPage} pageSize={userPageSize} total={usersTotal} onChange={setUserPage} />
          </CardContent>
        </Card>

        {/* View/Edit User and Role management modals (Admins & GM) */}
        <>

            <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="User — View">
              {viewUser && (
                <div className="space-y-2 text-sm">
                  <div><b>Name:</b> {viewUser.name}</div>
                  <div><b>Email:</b> {viewUser.email}</div>
                  <div><b>Role:</b> {prettifyRole(viewUser.role)}</div>
                  <div><b>Status:</b> {toUiStatus(viewUser.status)}</div>
                </div>
              )}
            </Modal>
            <Modal open={!!editUser} onClose={() => setEditUser(null)} title="User — Edit">
              {editUser && (
                <div className="space-y-3">
                  <Input label="Name" value={editUser.name} onChange={(e: any) => setEditUser({ ...editUser, name: e.target.value })} />
                  <Input label="Email" value={editUser.email} onChange={(e: any) => setEditUser({ ...editUser, email: e.target.value })} />
                  <Select label="Role" value={editRoleId} onChange={(e: any) => setEditRoleId(e.target.value)}>
                    {filteredRoles.map((r) => <option key={r.id} value={r.id}>{prettifyRole(r.name)}</option>)}
                  </Select>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
                    <Button onClick={handleEditSave}>Save</Button>
                  </div>
                </div>
              )}
            </Modal>

            {/* Add User */}
            <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add User">
              <div className="space-y-3">
                <Input label="Name" value={addName} onChange={(e: any) => setAddName(e.target.value)} />
                <Input label="Email" value={addEmail} onChange={(e: any) => setAddEmail(e.target.value)} />
                <Input label="Password" type="password" value={addPassword} onChange={(e: any) => setAddPassword(e.target.value)} />
                <Select label="Role" value={addRoleId} onChange={(e: any) => setAddRoleId(e.target.value)}>
                  <option value="">Select role…</option>
                  {filteredRoles.map((r) => <option key={r.id} value={r.id}>{prettifyRole(r.name)}</option>)}
                </Select>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateUser} disabled={!addName || !addEmail || !addRoleId}>Create</Button>
                </div>
              </div>
            </Modal>

            {/* Reset Password */}
            <Modal open={!!resetUser} onClose={() => { setResetUser(null); setResetPassword(''); }} title="Reset Password">
              {resetUser && (
                <div className="space-y-3">
                  <div className="text-sm zynq-muted">Reset password for <span className="font-semibold">{resetUser.name || resetUser.email}</span></div>
                  <Input
                    label="New Password"
                    type="password"
                    value={resetPassword}
                    onChange={(e: any) => setResetPassword((e.target as HTMLInputElement).value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => { setResetUser(null); setResetPassword(''); }} disabled={resetSubmitting}>
                      Cancel
                    </Button>
                    <Button onClick={handleResetPasswordSubmit} disabled={!resetPassword || resetSubmitting}>
                      Reset Password
                    </Button>
                  </div>
                </div>
              )}
            </Modal>

            {/* View Role (still hidden from GM via routing to /admin/roles) */}
            <Modal open={!!viewRole} onClose={() => setViewRole(null)} title="Role — View">
              {viewRole && (
                <div className="space-y-2 text-sm">
                  <div><b>Role:</b> {prettifyRole(viewRole.name)}</div>
                  <div><b>Permissions:</b> {viewRole.permissions}</div>
                </div>
              )}
            </Modal>
          </>
        </div>
      </IonContent>
    </IonPage>
  );
}

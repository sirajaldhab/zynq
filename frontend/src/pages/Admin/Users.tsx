import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import { useQueryParam } from '../../hooks/useQueryParam';
import Table, { Column } from '../../ui/Table';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Pagination from '../../ui/Pagination';
import Modal from '../../ui/Modal';
import { fetchUsers, createUser, updateUser, deleteUser, fetchRoles, UserDto, RoleDto } from '../../api/adminService';
import { chevronBackOutline } from 'ionicons/icons';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [present] = useIonToast();
  const [search, setSearch] = useQueryParam<string>('q', '');
  const [status, setStatus] = useQueryParam<string>('status', 'All');
  const [role, setRole] = useQueryParam<string>('role', '');
  const [page, setPage] = useQueryParam<number>('page', 1);
  const pageSize = 10;
  const [rows, setRows] = React.useState<UserDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [roles, setRoles] = React.useState<RoleDto[]>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<UserDto | null>(null);
  const [approveRow, setApproveRow] = React.useState<UserDto | null>(null);
  const [pendingRows, setPendingRows] = React.useState<UserDto[]>([]);
  const fmtDate = (s?: string) => (s ? new Date(s).toLocaleString() : '');

  const filteredRoles = React.useMemo(
    () => roles.filter((r) => {
      const n = (r.name || '').toUpperCase();
      return !['ADMIN', 'STAFF', 'EMPLOYEE', 'MANAGER'].includes(n);
    }),
    [roles],
  );

  const filteredRows = React.useMemo(
    () => rows.filter((u) => !['STAFF', 'EMPLOYEE'].includes(((u.role as any)?.name || '').toUpperCase())),
    [rows],
  );

  const columns: Column<UserDto>[] = [
    { key: 'email', header: 'Email' },
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status', render: (r) => (r.status === 'ACTIVE' ? 'Approved' : r.status === 'PENDING' ? 'Pending' : 'Rejected') },
    { key: 'role', header: 'Role', render: (r) => r.role?.name || '' },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEditRow(r)}>Edit</Button>
          <Button size="sm" variant="secondary" onClick={() => onDelete(r)}>Delete</Button>
          {r.status === 'PENDING' && (
            <>
              <Button size="sm" onClick={() => setApproveRow(r)}>Approve</Button>
              <Button size="sm" variant="secondary" onClick={() => onUpdate(r.id, { status: 'REJECTED' })}>Reject</Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const pendingColumns: Column<UserDto>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (r) => r.role?.name || r.roleId || '' },
    { key: 'createdAt', header: 'Signup Date', render: (r) => fmtDate(r.createdAt) },
    { key: 'status', header: 'Status', render: (r) => (r.status === 'ACTIVE' ? 'Approved' : r.status === 'PENDING' ? 'Pending' : 'Rejected') },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setApproveRow(r)}>Approve</Button>
          <Button size="sm" variant="secondary" onClick={() => onUpdate(r.id, { status: 'REJECTED' })}>Reject</Button>
          <Button size="sm" variant="secondary" onClick={() => setEditRow(r)}>Change Role</Button>
        </div>
      ),
    },
  ];

  async function load() {
    const token = localStorage.getItem('accessToken') || undefined;
    try {
      const effectiveStatus = status === 'Approved' ? 'ACTIVE' : status === 'Pending' ? 'PENDING' : status === 'Rejected' ? 'REJECTED' : status;
      const res = await fetchUsers({ page, pageSize, search, role: role || undefined, status: effectiveStatus, token });
      setRows(res.data);
      setTotal(res.total ?? res.data.length);
      // Load pending approvals snapshot
      const pendingRes = await fetchUsers({ page: 1, pageSize: 50, status: 'PENDING', search: '', role: undefined, token });
      setPendingRows(pendingRes.data || []);
    } catch (e) {
      present({ message: 'Failed to load users', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function loadRoles() {
    const token = localStorage.getItem('accessToken') || undefined;
    try {
      const list = await fetchRoles({ token });
      setRoles(list);
    } catch {}
  }

  React.useEffect(() => {
    load();
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, role, page]);

  async function onCreate(body: { email: string; name: string; roleId: string; password?: string; status?: string }) {
    const token = localStorage.getItem('accessToken') || undefined;
    try {
      await createUser({ ...body, token });
      present({ message: 'User created', color: 'success', duration: 1500, position: 'top' });
      setAddOpen(false);
      load();
    } catch (e) {
      present({ message: 'Create failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function onUpdate(id: string, body: Partial<{ email: string; name: string; roleId: string; status: string; password?: string }>) {
    const token = localStorage.getItem('accessToken') || undefined;
    try {
      await updateUser({ id, token }, body);
      present({ message: 'User updated', color: 'success', duration: 1500, position: 'top' });
      setEditRow(null);
      load();
    } catch (e) {
      present({ message: 'Update failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function onDelete(r: UserDto) {
    const token = localStorage.getItem('accessToken') || undefined;
    try {
      await deleteUser({ id: r.id, token });
      present({ message: 'User deleted', color: 'success', duration: 1500, position: 'top' });
      load();
    } catch (e) {
      present({ message: 'Delete failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Admin / Users</div>
        <div className="zynq-muted text-sm">Home &gt; Admin &gt; Users</div>
        <div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 flex items-center gap-2"
            onClick={() => navigate('/admin')}
          >
            <IonIcon icon={chevronBackOutline} />
            <span>Back</span>
          </Button>
        </div>
        {/* Pending Approvals */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Pending User Requests</div>
            <div className="text-xs zynq-muted">{pendingRows.length} pending</div>
          </div>
          {pendingRows.length === 0 ? (
            <div className="text-sm zynq-muted border zynq-border rounded-lg p-4 bg-[color:var(--surface)]">No pending account requests.</div>
          ) : (
            <Table
              columns={pendingColumns}
              data={pendingRows}
              emptyText="No pending users"
            />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
          <Input label="Search" placeholder="email/name" value={search} onChange={(e) => setSearch((e.target as HTMLInputElement).value)} />
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select className="w-full zynq-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Role</label>
            <select className="w-full zynq-input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All</option>
              {filteredRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end"><Button onClick={() => setAddOpen(true)}>Add User</Button></div>
        </div>
        <Table columns={columns} data={filteredRows} emptyText="No users" />
        <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
      </IonContent>
      <AddUserModal roles={roles} open={addOpen} onClose={() => setAddOpen(false)} onSubmit={onCreate} />
      <EditUserModal
        roles={roles}
        row={editRow}
        onClose={() => setEditRow(null)}
        onSubmit={(b) => {
          if (editRow) return onUpdate(editRow.id, b);
        }}
      />
      <ApproveUserModal
        roles={roles}
        row={approveRow}
        onClose={() => setApproveRow(null)}
        onSubmit={(roleId) => {
          if (approveRow) return onUpdate(approveRow.id, { status: 'ACTIVE', roleId });
        }}
      />
    </IonPage>
  );
}

function AddUserModal({ roles, open, onClose, onSubmit }: { roles: RoleDto[]; open: boolean; onClose: () => void; onSubmit: (body: { email: string; name: string; roleId: string; password?: string; status?: string }) => Promise<void> | void }) {
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [roleId, setRoleId] = React.useState('');
  const [status, setStatus] = React.useState<'PENDING'|'ACTIVE'|'REJECTED'>('ACTIVE');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const filteredRoles = React.useMemo(
    () => roles.filter((r) => !['STAFF', 'EMPLOYEE'].includes((r.name || '').toUpperCase())),
    [roles],
  );
  React.useEffect(() => { if (!open) { setEmail(''); setName(''); setRoleId(''); setStatus('ACTIVE'); setPassword(''); } }, [open]);
  const emailOk = /.+@.+\..+/.test(email);
  const canCreate = emailOk && !!name && !!roleId;
  return (
    <Modal open={open} onClose={onClose} title="Add User">
      <div className="space-y-3">
        <Input label="Email" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} />
        <Input label="Name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} />
        <Input label="Password" value={password} onChange={(e) => setPassword((e.target as HTMLInputElement).value)} />
        <div>
          <label className="block text-sm mb-1">Role</label>
          <select className="w-full zynq-input" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            <option value="">Select role</option>
            {filteredRoles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select className="w-full zynq-input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={async () => { setSubmitting(true); try { await onSubmit({ email, name, roleId, password: password || undefined, status }); } finally { setSubmitting(false); } }} disabled={!canCreate || submitting}>Create</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditUserModal({ roles, row, onClose, onSubmit }: { roles: RoleDto[]; row: UserDto | null; onClose: () => void; onSubmit: (body: Partial<{ email: string; name: string; roleId: string; status: string; password?: string }>) => Promise<void> | void }) {
  const [email, setEmail] = React.useState(row?.email || '');
  const [name, setName] = React.useState(row?.name || '');
  const [roleId, setRoleId] = React.useState(row?.roleId || '');
  const [status, setStatus] = React.useState<'PENDING'|'ACTIVE'|'REJECTED'>(
    (row?.status as any) || 'PENDING'
  );
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  React.useEffect(() => { setEmail(row?.email || ''); setName(row?.name || ''); setRoleId(row?.roleId || ''); setStatus((row?.status as any) || 'PENDING'); setPassword(''); }, [row]);
  const emailOk = !email || /.+@.+\..+/.test(email);
  const canSave = emailOk && (!!name || name === '') && (!!roleId || roleId === '') && (!!status || status === '');
  return (
    <Modal open={!!row} onClose={onClose} title="Edit User">
      {row && (
        <div className="space-y-3">
          <Input label="Email" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} />
          <Input label="Name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} />
          <div>
            <label className="block text-sm mb-1">Role</label>
            <select className="w-full zynq-input" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              <option value="">Select role</option>
              {filteredRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select className="w-full zynq-input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <Input label="New Password (optional)" value={password} onChange={(e) => setPassword((e.target as HTMLInputElement).value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button onClick={async () => { setSubmitting(true); try { await onSubmit({ email, name, roleId, status, password: password || undefined }); } finally { setSubmitting(false); } }} disabled={!canSave || submitting}>Save</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ApproveUserModal({ roles, row, onClose, onSubmit }: { roles: RoleDto[]; row: UserDto | null; onClose: () => void; onSubmit: (roleId: string) => Promise<void> | void }) {
  const filteredRoles = React.useMemo(
    () => roles.filter((r) => !['STAFF', 'EMPLOYEE'].includes((r.name || '').toUpperCase())),
    [roles],
  );
  const [roleId, setRoleId] = React.useState(row?.roleId || (filteredRoles[0]?.id || ''));
  const [submitting, setSubmitting] = React.useState(false);
  React.useEffect(() => { setRoleId(row?.roleId || (filteredRoles[0]?.id || '')); }, [row, filteredRoles]);
  return (
    <Modal open={!!row} onClose={onClose} title="Approve Account">
      {row && (
        <div className="space-y-3">
          <div className="text-sm zynq-muted">Approve account for <span className="font-medium">{row.name} ({row.email})</span></div>
          <div>
            <label className="block text-sm mb-1">Role</label>
            <select className="w-full zynq-input" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              {filteredRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button onClick={async () => { setSubmitting(true); try { await onSubmit(roleId); } finally { setSubmitting(false); } }} disabled={!roleId || submitting}>Approve</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

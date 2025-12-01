import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import Table, { Column } from '../../ui/Table';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { fetchRoles, createRole, updateRole, deleteRole, RoleDto, parsePermissions, PermissionsShape } from '../../api/adminService';
import Select from '../../ui/Select';
import { useAuth } from '../../auth/AuthContext';

export default function AdminRolesPermissions() {
  const [present] = useIonToast();
  const { accessToken, role } = useAuth();
  const [rows, setRows] = React.useState<RoleDto[]>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<RoleDto | null>(null);
  const [permRow, setPermRow] = React.useState<RoleDto | null>(null);
  const isAdmin = role === 'ADMIN';

  const filteredRows = React.useMemo(
    () => rows.filter((r) => !['STAFF', 'EMPLOYEE', 'MANAGER'].includes((r.name || '').toUpperCase())),
    [rows],
  );

  const columns: Column<RoleDto>[] = [
    { key: 'name', header: 'Role Name' },
    { key: 'description', header: 'Description', render: (r: RoleDto) => r.description || '-' },
    { key: 'status', header: 'Status', render: (r: RoleDto) => (
      <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>{r.status || 'ACTIVE'}</span>
    ) },
    isAdmin ? {
      key: 'actions',
      header: 'Actions',
      render: (r: RoleDto) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEditRow(r)}>Edit</Button>
          <Button size="sm" variant="secondary" onClick={() => setPermRow(r)}>Manage Permissions</Button>
          {r.name !== 'ADMIN' && (
            <Button size="sm" variant="danger" onClick={() => onDelete(r)}>Delete</Button>
          )}
        </div>
      ),
    } : (undefined as any),
  ].filter(Boolean) as Column<RoleDto>[];

  async function load() {
    const token = accessToken || undefined;
    try {
      const list = await fetchRoles({ token });
      setRows(list);
    } catch (e) {
      present({ message: 'Failed to load roles', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  React.useEffect(() => {
    if (isAdmin && accessToken) load();
  }, [isAdmin, accessToken]);

  async function onCreate(body: { name: string; description?: string; status?: string; baseRoleName?: string; permissionsJson?: string }) {
    const token = accessToken || undefined;
    try {
      await createRole({ ...body, token });
      present({ message: 'Role created successfully.', color: 'success', duration: 1500, position: 'top' });
      setAddOpen(false);
      load();
    } catch (e: any) {
      const msg = e?.message || 'Create failed';
      present({ message: msg, color: 'danger', duration: 2500, position: 'top' });
    }
  }

  async function onUpdate(id: string, body: Partial<{ name: string; description: string; status: string; permissionsJson: string }>) {
    const token = accessToken || undefined;
    try {
      await updateRole({ id, token }, body);
      present({ message: 'Role updated', color: 'success', duration: 1500, position: 'top' });
      setEditRow(null);
      load();
    } catch (e: any) {
      const msg = e?.message || 'Update failed';
      present({ message: msg, color: 'danger', duration: 2500, position: 'top' });
    }
  }

  async function onDelete(r: RoleDto) {
    const token = accessToken || undefined;
    try {
      await deleteRole({ id: r.id, token });
      present({ message: 'Role deleted', color: 'success', duration: 1500, position: 'top' });
      load();
    } catch (e: any) {
      const msg = e?.message || 'Delete failed';
      present({ message: msg, color: 'danger', duration: 2500, position: 'top' });
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Admin / Roles & Permissions</div>
        <div className="zynq-muted text-sm">Home &gt; Admin &gt; Roles & Permissions</div>
        {!isAdmin ? (
          <div className="mt-6 border zynq-border rounded-xl p-6 bg-[color:var(--card-bg)]">
            <div className="font-medium mb-1">Read-only access</div>
            <div className="text-sm zynq-muted">You don't have permission to manage roles and permissions. Please contact an administrator.</div>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-3 mt-4">
              <Button onClick={() => setAddOpen(true)}>Add Role</Button>
            </div>
            <Table columns={columns} data={filteredRows} emptyText="No roles" />
          </>
        )}
      </IonContent>
      {isAdmin && <AddRoleModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={onCreate} />}
      {isAdmin && (
      <EditRoleModal
        row={editRow}
        onClose={() => setEditRow(null)}
        onSubmit={(b) => {
          if (editRow) return onUpdate(editRow.id, b);
        }}
      />)}
      {isAdmin && (
      <PermissionsModal
        row={permRow}
        onClose={() => setPermRow(null)}
        onChange={async (updated) => {
          if (!permRow) return;
          const token = accessToken || undefined;
          try {
            await updateRole({ id: permRow.id, token }, { permissionsJson: JSON.stringify(updated) });
            present({ message: 'Permissions updated', color: 'success', duration: 1200, position: 'top' });
            // refresh in background
            load();
          } catch (e: any) {
            const msg = e?.message || 'Failed to update permissions';
            present({ message: msg, color: 'danger', duration: 2000, position: 'top' });
          }
        }}
      />)}
    </IonPage>
  );
}

function AddRoleModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (body: { name: string; description?: string; status?: string; baseRoleName?: string; permissionsJson?: string }) => Promise<void> | void }) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [baseRoleName, setBaseRoleName] = React.useState<string>('');
  const [status, setStatus] = React.useState<string>('ACTIVE');
  const [submitting, setSubmitting] = React.useState(false);
  React.useEffect(() => { if (!open) { setName(''); setDescription(''); setBaseRoleName(''); setStatus('ACTIVE'); } }, [open]);
  const nameOk = name.trim().length > 0;
  return (
    <Modal open={open} onClose={onClose} title="Add Role">
      <div className="space-y-3">
        <Input label="Name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} />
        <Input label="Description (optional)" value={description} onChange={(e) => setDescription((e.target as HTMLInputElement).value)} />
        <Select label="Base Role (optional)" value={baseRoleName} onChange={(e) => setBaseRoleName((e.target as HTMLSelectElement).value)}>
          <option value="">None</option>
          {['ADMIN','MANAGER','ACCOUNTANT','HR_MANAGER','FINANCE_MANAGER'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
        <Select label="Status" value={status} onChange={(e) => setStatus((e.target as HTMLSelectElement).value)}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </Select>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={async () => { setSubmitting(true); try { await onSubmit({ name, description: description || undefined, status, baseRoleName: baseRoleName || undefined }); } finally { setSubmitting(false); } }} disabled={!nameOk || submitting}>Create</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditRoleModal({ row, onClose, onSubmit }: { row: RoleDto | null; onClose: () => void; onSubmit: (body: Partial<{ name: string; description: string; status: string }>) => Promise<void> | void }) {
  const [name, setName] = React.useState(row?.name || '');
  const [description, setDescription] = React.useState(row?.description || '');
  const [status, setStatus] = React.useState(row?.status || 'ACTIVE');
  const [submitting, setSubmitting] = React.useState(false);
  React.useEffect(() => { setName(row?.name || ''); setDescription(row?.description || ''); setStatus(row?.status || 'ACTIVE'); }, [row]);
  const nameOk = !name || name.trim().length > 0;
  return (
    <Modal open={!!row} onClose={onClose} title="Edit Role">
      {row && (
        <div className="space-y-3">
          <Input label="Name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} />
          <Input label="Description (optional)" value={description} onChange={(e) => setDescription((e.target as HTMLInputElement).value)} />
          <Select label="Status" value={status} onChange={(e) => setStatus((e.target as HTMLSelectElement).value)}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button onClick={async () => { setSubmitting(true); try { await onSubmit({ name: name || undefined, description: description || undefined, status: status || undefined }); } finally { setSubmitting(false); } }} disabled={!nameOk || submitting}>Save</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function PermissionsModal({ row, onClose, onChange }: { row: RoleDto | null; onClose: () => void; onChange: (p: PermissionsShape) => void | Promise<void> }) {
  const [local, setLocal] = React.useState<PermissionsShape | null>(null);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    if (row) setLocal(parsePermissions(row.permissionsJson)); else setLocal(null);
    setSaving(false);
  }, [row]);
  if (!row || !local) return null;
  const cats = Object.keys(local) as (keyof PermissionsShape)[];
  const actions: (keyof PermissionsShape[typeof cats[number]])[] = ['view','create','edit','delete','manage'];
  return (
    <Modal open={!!row} onClose={onClose} title={`Manage Permissions  ${row.name}`}>
      <div className="space-y-4">
        {cats.map((cat) => (
          <div key={String(cat)} className="border zynq-border rounded-xl p-3">
            <div className="font-medium mb-2">{cat}</div>
            <div className="grid grid-cols-5 gap-2">
              {actions.map((act) => (
                <label key={String(act)} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={local[cat][act]}
                    onChange={(e) => {
                      const next = { ...local, [cat]: { ...local[cat], [act]: e.target.checked } } as PermissionsShape;
                      setLocal(next);
                    }}
                  />
                  <span className="capitalize">{String(act)}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!local) return;
              setSaving(true);
              try {
                await onChange(local);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

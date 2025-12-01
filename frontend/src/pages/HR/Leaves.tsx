import React from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import { useQueryParam } from '../../hooks/useQueryParam';
import Table, { Column } from '../../ui/Table';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Pagination from '../../ui/Pagination';
import Modal from '../../ui/Modal';
import { fetchLeaves, createLeave, updateLeave, deleteLeave, LeaveDto } from '../../api/hrService';

export default function HRLeaves() {
  const [present] = useIonToast();
  const [status, setStatus] = useQueryParam<string>('status', 'All');
  const [employeeId, setEmployeeId] = useQueryParam<string>('employeeId', '');
  const [start, setStart] = useQueryParam<string>('start', '');
  const [end, setEnd] = useQueryParam<string>('end', '');
  const [page, setPage] = useQueryParam<number>('page', 1);
  const pageSize = 10;
  const [rows, setRows] = React.useState<LeaveDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<LeaveDto | null>(null);
  const [loading, setLoading] = React.useState(false);

  const columns: Column<LeaveDto>[] = [
    { key: 'employeeId', header: 'Employee ID' },
    { key: 'type', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'start_date', header: 'Start', render: (r) => new Date(r.start_date).toLocaleDateString() },
    { key: 'end_date', header: 'End', render: (r) => new Date(r.end_date).toLocaleDateString() },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEditRow(r)}>Edit</Button>
          <Button size="sm" variant="secondary" onClick={() => onDelete(r)}>Delete</Button>
        </div>
      ),
    },
  ];

  async function load() {
    const token = localStorage.getItem('token') || undefined;
    try {
      setLoading(true);
      const res = await fetchLeaves({ page, pageSize, status, employeeId: employeeId || undefined, start: start || undefined, end: end || undefined, token });
      setRows(res.data);
      setTotal(res.total ?? res.data.length);
    } catch (e) {
      present({ message: 'Failed to load leaves', color: 'danger', duration: 2000, position: 'top' });
      setRows([]); setTotal(0);
    } finally { setLoading(false); }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, employeeId, start, end, page]);

  async function onCreate(body: { employeeId: string; start_date: string; end_date: string; type: string; status?: string }) {
    const token = localStorage.getItem('token') || undefined;
    try {
      await createLeave({ ...body, token });
      present({ message: 'Leave created', color: 'success', duration: 1500, position: 'top' });
      setAddOpen(false);
      load();
    } catch (e) {
      present({ message: 'Create failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function onUpdate(id: string, body: Partial<{ start_date: string; end_date: string; type: string; status: string }>) {
    const token = localStorage.getItem('token') || undefined;
    try {
      await updateLeave({ id, token }, body);
      present({ message: 'Leave updated', color: 'success', duration: 1500, position: 'top' });
      setEditRow(null);
      load();
    } catch (e) {
      present({ message: 'Update failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function onDelete(r: LeaveDto) {
    const token = localStorage.getItem('token') || undefined;
    try {
      await deleteLeave({ id: r.id, token });
      present({ message: 'Leave deleted', color: 'success', duration: 1500, position: 'top' });
      load();
    } catch (e) {
      present({ message: 'Delete failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">HR / Leaves</div>
        <div className="zynq-muted text-sm">Home &gt; HR &gt; Leaves</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <Input label="Status" placeholder="All/Approved/Pending/Rejected" value={status} onChange={(e) => setStatus((e.target as HTMLInputElement).value)} />
          <Input label="Employee ID (optional)" value={employeeId} onChange={(e) => setEmployeeId((e.target as HTMLInputElement).value)} />
          <Input label="Start (YYYY-MM-DD)" type="date" value={start} onChange={(e) => setStart((e.target as HTMLInputElement).value)} />
          <Input label="End (YYYY-MM-DD)" type="date" value={end} onChange={(e) => setEnd((e.target as HTMLInputElement).value)} />
        </div>
        <div className="flex justify-end mt-2"><Button onClick={() => setAddOpen(true)}>New Leave</Button></div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><IonSpinner name="dots" /></div>
        ) : (
          <Table columns={columns} data={rows} emptyText="No leaves" />
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
      </IonContent>
      <AddLeaveModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={onCreate} />
      <EditLeaveModal
        row={editRow}
        onClose={() => setEditRow(null)}
        onSubmit={(b) => {
          if (editRow) return onUpdate(editRow.id, b);
        }}
      />
    </IonPage>
  );
}

function AddLeaveModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (body: { employeeId: string; start_date: string; end_date: string; type: string; status?: string }) => Promise<void> | void }) {
  const [employeeId, setEmployeeId] = React.useState('');
  const [type, setType] = React.useState('Annual');
  const [status, setStatus] = React.useState('PENDING');
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  React.useEffect(() => { if (!open) { setEmployeeId(''); setType('Annual'); setStatus('PENDING'); setStart(''); setEnd(''); } }, [open]);
  const validDates = start && end && new Date(start) <= new Date(end);
  const canCreate = !!employeeId && !!type && validDates;
  return (
    <Modal open={open} onClose={onClose} title="New Leave">
      <div className="space-y-3">
        <Input label="Employee ID" value={employeeId} onChange={(e) => setEmployeeId((e.target as HTMLInputElement).value)} />
        <Input label="Type" value={type} onChange={(e) => setType((e.target as HTMLInputElement).value)} />
        <Input label="Status" value={status} onChange={(e) => setStatus((e.target as HTMLInputElement).value)} />
        <Input label="Start Date (ISO)" value={start} onChange={(e) => setStart((e.target as HTMLInputElement).value)} />
        <Input label="End Date (ISO)" value={end} onChange={(e) => setEnd((e.target as HTMLInputElement).value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={async () => { setSubmitting(true); try { await onSubmit({ employeeId, type, status, start_date: start, end_date: end }); } finally { setSubmitting(false); } }} disabled={!canCreate || submitting}>Create</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditLeaveModal({ row, onClose, onSubmit }: { row: LeaveDto | null; onClose: () => void; onSubmit: (body: Partial<{ start_date: string; end_date: string; type: string; status: string }>) => Promise<void> | void }) {
  const [type, setType] = React.useState(row?.type || '');
  const [status, setStatus] = React.useState(row?.status || '');
  const [start, setStart] = React.useState(row?.start_date || '');
  const [end, setEnd] = React.useState(row?.end_date || '');
  const [submitting, setSubmitting] = React.useState(false);
  React.useEffect(() => { setType(row?.type || ''); setStatus(row?.status || ''); setStart(row?.start_date || ''); setEnd(row?.end_date || ''); }, [row]);
  const validDates = !start || !end || new Date(start) <= new Date(end);
  return (
    <Modal open={!!row} onClose={onClose} title="Edit Leave">
      {row && (
        <div className="space-y-3">
          <Input label="Type" value={type} onChange={(e) => setType((e.target as HTMLInputElement).value)} />
          <Input label="Status" value={status} onChange={(e) => setStatus((e.target as HTMLInputElement).value)} />
          <Input label="Start Date (ISO)" value={start} onChange={(e) => setStart((e.target as HTMLInputElement).value)} />
          <Input label="End Date (ISO)" value={end} onChange={(e) => setEnd((e.target as HTMLInputElement).value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button onClick={async () => { setSubmitting(true); try { await onSubmit({ type: type || undefined, status: status || undefined, start_date: start || undefined, end_date: end || undefined }); } finally { setSubmitting(false); } }} disabled={!validDates || submitting}>Save</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

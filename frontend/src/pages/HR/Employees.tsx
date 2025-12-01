import React from 'react';
import { IonPage, IonContent, IonSpinner, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import { useQueryParam } from '../../hooks/useQueryParam';
import Table, { Column } from '../../ui/Table';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Pagination from '../../ui/Pagination';
import Modal from '../../ui/Modal';
import Select from '../../ui/Select';
import { fetchEmployees, createEmployee, createEmployeeWithUser, updateEmployee, deleteEmployee, EmployeeDto } from '../../api/hrService';
import { usePermissions } from '../../auth/usePermissions';
import { useAuth } from '../../auth/AuthContext';
import { fetchDocumentCompanies, DocumentCompanyDto } from '../../api/documentsService';
import { chevronBackOutline } from 'ionicons/icons';

export default function HREmployees() {
  const navigate = useNavigate();
  const [present] = useIonToast();
  const { role } = useAuth();
  const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';
  const { can } = usePermissions();
  const [page, setPage] = useQueryParam<number>('page', 1);
  const pageSize = 10;
  const [rows, setRows] = React.useState<EmployeeDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [filterCompany, setFilterCompany] = React.useState('');
  const [companies, setCompanies] = React.useState<DocumentCompanyDto[]>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<EmployeeDto | null>(null);
  const [deleteRow, setDeleteRow] = React.useState<EmployeeDto | null>(null);
  const [loading, setLoading] = React.useState(false);

  const columns: Column<EmployeeDto>[] = [
    { key: 'company', header: 'COMPANY' },
    { key: 'employeeName', header: 'EMPLOYEE NAME' },
    { key: 'dateOfJoining', header: 'DATE OF JOINING' },
    { key: 'emiratesId', header: 'EMIRATES ID' },
    { key: 'labourCardNo', header: 'LABOUR CARD NO' },
    { key: 'mobileNo', header: 'MOB NO' },
    { key: 'bankAccountNo', header: 'BANK ACCOUNT NO' },
    { key: 'salary', header: 'SALARY' },
    {
      key: 'status',
      header: 'STATUS',
      render: (r) => {
        const s = (r.status || '').toUpperCase();
        const cls =
          s === 'ACTIVE'
            ? 'bg-emerald-500/10 text-emerald-500'
            : s === 'INACTIVE'
            ? 'bg-rose-500/10 text-rose-500'
            : 'bg-slate-500/10 text-slate-400';
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>
            {s}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          {!isTeamLeader && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditRow(r)}
                disabled={!can('HR.Employees.Edit')}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setDeleteRow(r)}
                disabled={!can('HR.Employees.Delete')}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  async function load() {
    const token = localStorage.getItem('token') || undefined;
    try {
      setLoading(true);
      const res = await fetchEmployees({
        page,
        pageSize,
        search: filterCompany || undefined,
        token,
      });
      setRows(res.data);
      setTotal(res.total ?? res.data.length);
    } catch (e) {
      present({ message: 'Failed to load employees', color: 'danger', duration: 2000, position: 'top' });
      setRows([]); setTotal(0);
    } finally { setLoading(false); }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCompany, page]);

  // Load companies for the Company filter dropdown
  React.useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token') || undefined;
        const res = await fetchDocumentCompanies({ page: 1, pageSize: 200, token });
        setCompanies(res.data || []);
      } catch {
        setCompanies([]);
      }
    })();
  }, []);

  async function onCreate(body: {
    company: string;
    employeeName: string;
    dateOfJoining: string;
    emiratesId: string;
    labourCardNo?: string;
    mobileNo: string;
    bankAccountNo?: string;
    salary: number;
    status: string;
  }) {
    const token = localStorage.getItem('token') || undefined;
    try {
      await createEmployee({
        company: body.company,
        employeeName: body.employeeName,
        dateOfJoining: body.dateOfJoining,
        emiratesId: body.emiratesId,
        labourCardNo: body.labourCardNo,
        mobileNo: body.mobileNo,
        bankAccountNo: body.bankAccountNo,
        salary: body.salary,
        status: body.status,
        token,
      });
      present({ message: 'Employee created', color: 'success', duration: 1500, position: 'top' });
      setAddOpen(false);
      load();
    } catch (e: any) {
      let msg = 'Create failed';
      const raw = e?.message as string | undefined;
      if (raw && raw.includes('{')) {
        const jsonPart = raw.slice(raw.indexOf('{'));
        try {
          const parsed = JSON.parse(jsonPart);
          if (typeof parsed?.message === 'string' && parsed.message.trim()) {
            msg = parsed.message;
          }
        } catch {
          // fall back to default message
        }
      }
      present({ message: msg, color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function onUpdate(id: string, body: Partial<{ name: string; status: string }>) {
    const token = localStorage.getItem('token') || undefined;
    try {
      await updateEmployee({ id, token }, body);
      present({ message: 'Employee updated', color: 'success', duration: 1500, position: 'top' });
      setEditRow(null);
      load();
    } catch (e) {
      present({ message: 'Update failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function onDelete(r: EmployeeDto) {
    const token = localStorage.getItem('token') || undefined;
    try {
      await deleteEmployee({ id: r.id, token });
      present({ message: 'Employee deleted', color: 'success', duration: 1500, position: 'top' });
      load();
    } catch (e) {
      present({ message: 'Delete failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)]">
        <div className="px-4 py-8 sm:px-6 lg:px-8 space-y-4">
          <div className="text-lg font-semibold">HR / Employees</div>
          <div className="zynq-muted text-sm">Home &gt; HR &gt; Employees</div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 flex items-center gap-2"
              onClick={() => navigate('/hr')}
            >
              <IonIcon icon={chevronBackOutline} />
              <span>Back</span>
            </Button>
          </div>
          <div className="flex items-end gap-3 mt-4">
            <div className="flex-1">
              <Select
                label="Company"
                value={filterCompany}
                onChange={(e) => {
                  setFilterCompany((e.target as HTMLSelectElement).value);
                  setPage(1);
                }}
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            {can('HR.Employees.Create') && !isTeamLeader && (
              <Button onClick={() => setAddOpen(true)}>Add Employee</Button>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><IonSpinner name="dots" /></div>
          ) : (
            <Table columns={columns} data={rows} emptyText="No employees" />
          )}
          <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </div>
      </IonContent>
      <AddEmployeeModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={onCreate} isTeamLeader={isTeamLeader} />
      <EditEmployeeModal
        row={editRow}
        onClose={() => setEditRow(null)}
        onSubmit={(b) => {
          if (editRow) return onUpdate(editRow.id, b);
        }}
        isTeamLeader={isTeamLeader}
      />
      <Modal open={!!deleteRow} onClose={() => setDeleteRow(null)} title="Confirm Delete">
        {deleteRow && (
          <div className="space-y-4">
            <div className="text-sm">Are you sure you want to delete this employee?</div>
            <div className="flex justify-end gap-2">
              {!isTeamLeader && (
                <>
                  <Button variant="secondary" onClick={() => setDeleteRow(null)}>Cancel</Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      await onDelete(deleteRow);
                      setDeleteRow(null);
                    }}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </IonPage>
  );
}

function AddEmployeeModal({ open, onClose, onSubmit, isTeamLeader }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: {
    company: string;
    employeeName: string;
    dateOfJoining: string;
    emiratesId: string;
    labourCardNo?: string;
    mobileNo: string;
    bankAccountNo?: string;
    salary: number;
    status: string;
  }) => Promise<void> | void;
  isTeamLeader: boolean;
}) {
  const [company, setCompany] = React.useState('');
  const [employeeName, setEmployeeName] = React.useState('');
  const [dateOfJoining, setDateOfJoining] = React.useState('');
  const [emiratesId, setEmiratesId] = React.useState('');
  const [labourCard, setLabourCard] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [bankAccount, setBankAccount] = React.useState('');
  const [salary, setSalary] = React.useState('');
  const [status, setStatus] = React.useState('ACTIVE');
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [companies, setCompanies] = React.useState<DocumentCompanyDto[]>([]);

  React.useEffect(() => {
    if (!open) {
      setCompany('');
      setEmployeeName('');
      setDateOfJoining('');
      setEmiratesId('');
      setLabourCard('');
      setMobile('');
      setBankAccount('');
      setSalary('');
      setStatus('ACTIVE');
      setPreviewOpen(false);
      setSubmitting(false);
    } else {
      // Load companies from Documents > Company List when modal opens
      (async () => {
        try {
          const token = localStorage.getItem('token') || undefined;
          const res = await fetchDocumentCompanies({ page: 1, pageSize: 200, token });
          setCompanies(res.data || []);
        } catch {
          setCompanies([]);
        }
      })();
    }
  }, [open]);

  const canContinue =
    !!company &&
    !!employeeName &&
    !!dateOfJoining &&
    !!emiratesId &&
    !!mobile &&
    !!salary &&
    !!status &&
    !submitting;

  const payload = {
    company,
    employeeName,
    dateOfJoining,
    emiratesId,
    labourCardNo: labourCard || undefined,
    mobileNo: mobile,
    bankAccountNo: bankAccount || undefined,
    salary: Number(salary || 0),
    status,
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Add Employee">
        <div className="space-y-3">
          <Select
            label="COMPANY"
            value={company}
            onChange={(e) => setCompany((e.target as HTMLSelectElement).value)}
            disabled={isTeamLeader}
          >
            <option value="">Select Company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input label="EMPLOYEE NAME" value={employeeName} onChange={(e) => setEmployeeName((e.target as HTMLInputElement).value)} disabled={isTeamLeader} />
          <Input label="DATE OF JOINING" type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining((e.target as HTMLInputElement).value)} disabled={isTeamLeader} />
          <Input label="EMIRATES ID" value={emiratesId} onChange={(e) => setEmiratesId((e.target as HTMLInputElement).value)} disabled={isTeamLeader} />
          <Input label="LABOUR CARD NO" value={labourCard} onChange={(e) => setLabourCard((e.target as HTMLInputElement).value)} disabled={isTeamLeader} />
          <Input label="MOB NO" value={mobile} onChange={(e) => setMobile((e.target as HTMLInputElement).value)} disabled={isTeamLeader} />
          <Input label="BANK ACCOUNT NO" value={bankAccount} onChange={(e) => setBankAccount((e.target as HTMLInputElement).value)} disabled={isTeamLeader} />
          <Input label="SALARY" type="number" value={salary} onChange={(e) => setSalary((e.target as HTMLInputElement).value)} disabled={isTeamLeader} />
          <Select label="STATUS" value={status} onChange={(e) => setStatus((e.target as HTMLSelectElement).value)} disabled={isTeamLeader}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </Select>
          {!isTeamLeader && (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button onClick={() => setPreviewOpen(true)} disabled={!canContinue}>Add</Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Confirm Employee Details"
      >
        <div className="space-y-4">
          <div className="overflow-auto rounded-xl border zynq-border bg-[color:var(--surface)] text-sm">
            <table className="min-w-full">
              <tbody>
                <tr><td className="px-4 py-2 font-medium">COMPANY</td><td className="px-4 py-2">{company}</td></tr>
                <tr><td className="px-4 py-2 font-medium">EMPLOYEE NAME</td><td className="px-4 py-2">{employeeName}</td></tr>
                <tr><td className="px-4 py-2 font-medium">DATE OF JOINING</td><td className="px-4 py-2">{dateOfJoining || '-'}</td></tr>
                <tr><td className="px-4 py-2 font-medium">EMIRATES ID</td><td className="px-4 py-2">{emiratesId || '-'}</td></tr>
                <tr><td className="px-4 py-2 font-medium">LABOUR CARD NO</td><td className="px-4 py-2">{labourCard || '-'}</td></tr>
                <tr><td className="px-4 py-2 font-medium">MOB NO</td><td className="px-4 py-2">{mobile || '-'}</td></tr>
                <tr><td className="px-4 py-2 font-medium">BANK ACCOUNT NO</td><td className="px-4 py-2">{bankAccount || '-'}</td></tr>
                <tr><td className="px-4 py-2 font-medium">SALARY</td><td className="px-4 py-2">{salary || '-'}</td></tr>
                <tr><td className="px-4 py-2 font-medium">STATUS</td><td className="px-4 py-2">{status}</td></tr>
              </tbody>
            </table>
          </div>
          {!isTeamLeader && (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPreviewOpen(false)} disabled={submitting}>Cancel</Button>
              <Button
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onSubmit(payload);
                    setPreviewOpen(false);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
              >
                Confirm
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

function EditEmployeeModal({ row, onClose, onSubmit, isTeamLeader }: {
  row: EmployeeDto | null;
  onClose: () => void;
  onSubmit: (body: Partial<{
    dateOfJoining: string;
    employeeName: string;
    labourCardNo: string;
    mobileNo: string;
    bankAccountNo: string;
    salary: number;
    status: string;
  }>) => Promise<void> | void;
  isTeamLeader: boolean;
}) {
  const [employeeName, setEmployeeName] = React.useState(row?.employeeName || '');
  const [dateOfJoining, setDateOfJoining] = React.useState('');
  const [labourCardNo, setLabourCardNo] = React.useState(row?.labourCardNo || '');
  const [mobileNo, setMobileNo] = React.useState(row?.mobileNo || '');
  const [bankAccountNo, setBankAccountNo] = React.useState(row?.bankAccountNo || '');
  const [salary, setSalary] = React.useState(row ? String(row.salary) : '');
  const [status, setStatus] = React.useState(row?.status || '');
  const [submitting, setSubmitting] = React.useState(false);
  React.useEffect(() => {
    if (row) {
      setEmployeeName(row.employeeName || '');
      setLabourCardNo(row.labourCardNo || '');
      setMobileNo(row.mobileNo || '');
      setBankAccountNo(row.bankAccountNo || '');
      setSalary(String(row.salary ?? ''));
      setStatus(row.status || '');
      if (row.dateOfJoining) {
        const d = new Date(row.dateOfJoining);
        const iso = d.toISOString().slice(0, 10);
        setDateOfJoining(iso);
      } else {
        setDateOfJoining('');
      }
    } else {
      setEmployeeName('');
      setLabourCardNo('');
      setMobileNo('');
      setBankAccountNo('');
      setSalary('');
      setStatus('');
      setDateOfJoining('');
    }
  }, [row]);
  return (
    <Modal open={!!row} onClose={onClose} title="Edit Employee">
      {row && (
        <div className="space-y-3">
          <Input label="COMPANY" value={row.company} disabled />
          <Input label="EMIRATES ID" value={row.emiratesId} disabled />
          <Input
            label="DATE OF JOINING"
            type="date"
            value={dateOfJoining}
            onChange={(e) => setDateOfJoining((e.target as HTMLInputElement).value)}
            disabled={isTeamLeader}
          />
          <Input
            label="EMPLOYEE NAME"
            value={employeeName}
            onChange={(e) => setEmployeeName((e.target as HTMLInputElement).value)}
            disabled={isTeamLeader}
          />
          <Input
            label="LABOUR CARD NO"
            value={labourCardNo}
            onChange={(e) => setLabourCardNo((e.target as HTMLInputElement).value)}
            disabled={isTeamLeader}
          />
          <Input
            label="MOB NO"
            value={mobileNo}
            onChange={(e) => setMobileNo((e.target as HTMLInputElement).value)}
            disabled={isTeamLeader}
          />
          <Input
            label="BANK ACCOUNT NO"
            value={bankAccountNo}
            onChange={(e) => setBankAccountNo((e.target as HTMLInputElement).value)}
            disabled={isTeamLeader}
          />
          <Input
            label="SALARY"
            type="number"
            value={salary}
            onChange={(e) => setSalary((e.target as HTMLInputElement).value)}
            disabled={isTeamLeader}
          />
          <Select
            label="STATUS"
            value={status}
            onChange={(e) => setStatus((e.target as HTMLSelectElement).value)}
            disabled={isTeamLeader}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </Select>
          {!isTeamLeader && (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onSubmit({
                      dateOfJoining: dateOfJoining || undefined,
                      employeeName: employeeName || undefined,
                      labourCardNo: labourCardNo || undefined,
                      mobileNo: mobileNo || undefined,
                      bankAccountNo: bankAccountNo || undefined,
                      salary: salary ? Number(salary) : undefined,
                      status: status || undefined,
                    });
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                Save
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

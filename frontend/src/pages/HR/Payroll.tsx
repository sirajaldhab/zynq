import React from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner, useIonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import { usePermissions } from '../../auth/usePermissions';
import Button from '../../ui/Button';
import Table, { Column } from '../../ui/Table';
import Pagination from '../../ui/Pagination';
import { useQueryParam } from '../../hooks/useQueryParam';
import { fetchEmployees, EmployeeDto } from '../../api/hrService';
import { chevronBackOutline } from 'ionicons/icons';

export default function HRPayroll() {
  const navigate = useNavigate();
  const [present] = useIonToast();
  const { can } = usePermissions();
  const [page, setPage] = useQueryParam<number>('page', 1);
  const pageSize = 10;
  const [rows, setRows] = React.useState<EmployeeDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const columns: Column<EmployeeDto>[] = [
    { key: 'company', header: 'Company' },
    {
      key: 'employeeName',
      header: 'Employee Name',
      render: (r) => (
        <button
          type="button"
          className="text-left text-[color:var(--accent)] hover:underline"
          onClick={() => {
            if (!can('HR.Payroll.Details.View')) return;
            navigate(`/hr/payroll/${r.id}/${encodeURIComponent(r.emiratesId)}`);
          }}
        >
          {r.employeeName}
        </button>
      ),
    },
    { key: 'emiratesId', header: 'Emirates ID' },
    {
      key: 'status',
      header: 'Status',
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
    { key: 'basicSalary', header: 'Basic Salary', render: () => '' } as any,
    { key: 'paidLeave', header: 'Paid Leave', render: () => '' } as any,
    { key: 'ot', header: 'OT', render: () => '' } as any,
    { key: 'advance', header: 'Advance', render: () => '' } as any,
    { key: 'gross', header: 'Gross', render: () => '' } as any,
  ];

  async function load() {
    const token = localStorage.getItem('token') || undefined;
    try {
      setLoading(true);
      const res = await fetchEmployees({ page, pageSize, token });
      setRows(res.data);
      setTotal(res.total ?? res.data.length);
    } catch (e) {
      present({ message: 'Failed to load employees for payroll', color: 'danger', duration: 2000, position: 'top' });
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)]">
        <div className="px-4 py-8 sm:px-6 lg:px-8 space-y-6">
          <div className="text-lg font-semibold">Payroll</div>
          <div className="zynq-muted text-sm">Home &gt; HR &gt; Payroll</div>
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
          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12"><IonSpinner name="dots" /></div>
            ) : (
              <Table
                columns={columns}
                data={rows}
                emptyText="No employees available for payroll"
              />
            )}
            <div className="mt-4">
              <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

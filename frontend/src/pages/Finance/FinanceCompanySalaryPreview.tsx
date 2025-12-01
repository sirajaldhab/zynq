import React, { useEffect, useState, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table, { Column } from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, fetchPayrolls } from '../../api/hrService';

type SalaryRow = {
  id: string;
  company: string;
  employeeName: string;
  emiratesId: string;
  totalSalary: number;
};

const columns: Column<SalaryRow>[] = [
  { key: 'company', header: 'Company' },
  { key: 'employeeName', header: 'Employee Name' },
  { key: 'emiratesId', header: 'Emirates ID' },
  {
    key: 'totalSalary',
    header: 'Total Salary',
    render: (r) =>
      r.totalSalary.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
  },
];

export default function FinanceCompanySalaryPreviewPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') || undefined;
      try {
        setLoading(true);

        const empRes = await fetchEmployees({ page: 1, pageSize: 1000, token });
        const employees = (empRes as any).data || [];

        const idToEmployee = new Map<string, any>();
        const eidToEmployee = new Map<string, any>();
        for (const e of employees) {
          idToEmployee.set(e.id, e);
          const eid = (e.emiratesId || '').trim();
          if (eid && !eidToEmployee.has(eid)) {
            eidToEmployee.set(eid, e);
          }
        }

        const payrollRes = await fetchPayrolls({ page: 1, pageSize: 1000, token });
        const payrolls = (payrollRes as any).data || [];

        const salaryRows: SalaryRow[] = [];

        for (const p of payrolls) {
          const eidFromJoined = (p as any).employee?.emiratesId as string | undefined;
          let emiratesId = (eidFromJoined || '').trim();
          if (!emiratesId) {
            const empById = idToEmployee.get(p.employeeId);
            emiratesId = (empById?.emiratesId || '').trim();
          }
          if (!emiratesId) continue;

          const emp = eidToEmployee.get(emiratesId);
          if (!emp) continue;

          let extras: any = (p as any).deductions_json ?? {};
          if (typeof extras === 'string') {
            try {
              extras = JSON.parse(extras);
            } catch {
              extras = {};
            }
          }

          const salaryPaid =
            typeof extras.salaryPaid === 'number' && !Number.isNaN(extras.salaryPaid)
              ? extras.salaryPaid
              : 0;
          const loan =
            typeof extras.loan === 'number' && !Number.isNaN(extras.loan)
              ? extras.loan
              : 0;

          if (extras.salaryPaid === undefined || extras.loan === undefined) {
            continue;
          }

          const totalSalary = salaryPaid + loan;

          salaryRows.push({
            id: p.id,
            company: emp.company,
            employeeName: emp.employeeName,
            emiratesId: emp.emiratesId,
            totalSalary,
          });
        }

        setRows(salaryRows);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const viewRows = useMemo(() => rows, [rows]);

  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Finance / Company Employee Salary (Read Only)</div>
            <div className="zynq-muted text-sm">Home &gt; Finance &gt; Company Employee Salary Preview</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/finance')}>
            Back to Finance
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Employee Salary (All)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<SalaryRow>
              columns={columns}
              data={viewRows}
              emptyText="No salary expenses"
            />
          </CardContent>
        </Card>
      </IonContent>
    </IonPage>
  );
}

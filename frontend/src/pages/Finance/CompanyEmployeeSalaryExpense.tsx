import React from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner, useIonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table, { Column } from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { chevronBackOutline } from 'ionicons/icons';
import { fetchEmployees, fetchPayrolls, EmployeeDto, PayrollDto } from '../../api/hrService';

type SalaryRow = {
  month: string;
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
    render: (r) => r.totalSalary.toLocaleString(),
  },
];

export default function CompanyEmployeeSalaryExpensePage() {
  const navigate = useNavigate();
  const [present] = useIonToast();
  const [rows, setRows] = React.useState<SalaryRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filterCompany, setFilterCompany] = React.useState<string>('');
  const [filterMonth, setFilterMonth] = React.useState<string>('');
  const [filterSearch, setFilterSearch] = React.useState<string>('');

  React.useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') || undefined;
      try {
        setLoading(true);
        // 1. Load all employees (single large page)
        const empRes = await fetchEmployees({ page: 1, pageSize: 1000, token });
        const employees: EmployeeDto[] = empRes.data || [];

        // Maps for strict joins: by ID and by Emirates ID
        const idToEmployee = new Map<string, EmployeeDto>();
        const eidToEmployee = new Map<string, EmployeeDto>();
        for (const e of employees) {
          idToEmployee.set(e.id, e);
          const eid = (e.emiratesId || '').trim();
          if (eid && !eidToEmployee.has(eid)) {
            eidToEmployee.set(eid, e);
          }
        }

        // 2. Load payroll records (single large page)
        const payrollRes = await fetchPayrolls({ page: 1, pageSize: 1000, token });
        const payrolls: PayrollDto[] = payrollRes.data || [];

        const salaryRows: SalaryRow[] = [];

        for (const p of payrolls) {
          // Derive Emirates ID strictly and match employee by Emirates ID
          const eidFromJoined = (p as any).employee?.emiratesId as string | undefined;
          let emiratesId = (eidFromJoined || '').trim();
          if (!emiratesId) {
            const empById = idToEmployee.get(p.employeeId);
            emiratesId = (empById?.emiratesId || '').trim();
          }
          if (!emiratesId) continue;

          const emp = eidToEmployee.get(emiratesId);
          if (!emp) continue;

          // Parse deductions_json for Salary Paid + Loan
          let extras: any = (p as any).deductions_json ?? {};
          if (typeof extras === 'string') {
            try {
              extras = JSON.parse(extras);
            } catch {
              extras = {};
            }
          }

          const salaryPaid = typeof extras.salaryPaid === 'number' && !Number.isNaN(extras.salaryPaid)
            ? extras.salaryPaid
            : 0;
          const loan = typeof extras.loan === 'number' && !Number.isNaN(extras.loan)
            ? extras.loan
            : 0;

          // Only include months where both Salary Paid and Loan are present (non-zero or explicitly set)
          if (extras.salaryPaid === undefined || extras.loan === undefined) continue;

          if (!p.month) continue;
          const d = new Date(p.month);
          if (!d.getTime()) continue;
          const monthLabel = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

          const totalSalary = salaryPaid + loan;

          salaryRows.push({
            month: monthLabel,
            company: emp.company,
            employeeName: emp.employeeName,
            emiratesId: emp.emiratesId,
            totalSalary,
          });
        }

        // Sort by month (descending) then by employee name
        salaryRows.sort((a, b) => {
          const ad = new Date(a.month).getTime();
          const bd = new Date(b.month).getTime();
          if (ad !== bd) return bd - ad;
          return a.employeeName.localeCompare(b.employeeName);
        });

        setRows(salaryRows);
      } catch (e) {
        console.error('Failed to load company employee salary expenses', e);
        present({ message: 'Failed to load salary expenses', color: 'danger', duration: 2000, position: 'top' });
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [present]);

  const viewRows = React.useMemo(() => {
    const q = (filterSearch || '').toLowerCase();
    return rows.filter((r) => {
      if (filterCompany && r.company !== filterCompany) return false;
      if (filterMonth && r.month !== filterMonth) return false;
      if (q) {
        const name = (r.employeeName || '').toLowerCase();
        const eid = (r.emiratesId || '').toLowerCase();
        if (!name.includes(q) && !eid.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filterCompany, filterMonth, filterSearch]);

  const totalAllEmployees = React.useMemo(
    () => viewRows.reduce((sum, r) => sum + (r.totalSalary || 0), 0),
    [viewRows],
  );

  function resetFilters() {
    setFilterCompany('');
    setFilterMonth('');
    setFilterSearch('');
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)] py-8">
        <div className="space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold">Finance / Expenses / Company Employee Salary</div>
          <div className="zynq-muted text-sm">Home &gt; Finance &gt; Expenses &gt; Company Employee Salary</div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 flex items-center gap-2"
              onClick={() => navigate('/finance/expenses/manpower')}
            >
              <IonIcon icon={chevronBackOutline} />
              <span>Back</span>
            </Button>
          </div>

          <Card>
          <CardHeader className="text-sm zynq-muted">
            Total Salary (All Employees)
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            <span className="text-[color:var(--danger)]">
              {totalAllEmployees.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>Company Employee Salary Expenses</CardTitle>
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <IonSpinner name="dots" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <Select
                    label="Company"
                    value={filterCompany}
                    onChange={(e) => setFilterCompany((e.target as HTMLSelectElement).value)}
                  >
                    <option value="">All Companies</option>
                    {Array.from(new Set(rows.map((r) => r.company))).sort().map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth((e.target as HTMLSelectElement).value)}
                  >
                    <option value="">All Months</option>
                    {Array.from(new Set(rows.map((r) => r.month))).map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Search Employee / Emirates ID"
                    placeholder="Type name or Emirates ID"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch((e.target as HTMLInputElement).value)}
                  />
                </div>
                {Array.from(
                  viewRows.reduce((acc, row) => {
                    const key = row.month;
                    if (!acc.has(key)) acc.set(key, [] as SalaryRow[]);
                    acc.get(key)!.push(row);
                    return acc;
                  }, new Map<string, SalaryRow[]>()),
                ).map(([month, monthRows]) => (
                  <Card key={month} className="mt-4">
                    <CardHeader>
                      <CardTitle>{month}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table<SalaryRow>
                        columns={columns}
                        data={monthRows}
                        emptyText="No salary expenses yet"
                      />
                      <div className="mt-2 text-sm">
                        <span className="zynq-muted mr-1">Subtotal:</span>
                        <span className="font-semibold text-[color:var(--danger)]">
                          {monthRows
                            .reduce((sum, r) => sum + (r.totalSalary || 0), 0)
                            .toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </IonContent>
    </IonPage>
  );
}

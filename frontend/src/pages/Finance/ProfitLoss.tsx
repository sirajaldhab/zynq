import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, useIonToast, IonIcon } from '@ionic/react';
import Nav from '../../components/Nav';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { useQueryParam } from '../../hooks/useQueryParam';
import { fetchProjects, ProjectDto } from '../../api/projectsService';
import { getUnifiedExpensesTotal, getInvoicesReceivedTotal } from '../../api/financeService';
import { chevronBackOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

export default function ProfitLoss() {
  const navigate = useNavigate();
  const [present] = useIonToast();
  const [projectId, setProjectId] = useQueryParam<string>('pnlProject', '');
  const [dateFrom, setDateFrom] = useQueryParam<string>('pnlFrom', '');
  const [dateTo, setDateTo] = useQueryParam<string>('pnlTo', '');

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);

  async function loadTotals() {
    const token = localStorage.getItem('token') || undefined;
    try {
      setLoading(true);

      // Inflows:
      // Use invoices aggregate for Received invoices (status Received/Paid),
      // summing the received amount for the given project/date range.
      const inflowPromise = getInvoicesReceivedTotal({
        projectId: projectId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        token,
      });

      // Expenses:
      // Use unified expenses aggregate which combines:
      // - Expense & General Expense rows
      // - Company employee salary (SalaryPaid + Loan)
      // - External manpower paid amounts
      const expensePromise = getUnifiedExpensesTotal({
        projectId: projectId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        token,
      });

      const [inRes, outRes] = await Promise.all([inflowPromise, expensePromise]);

      const inVal = Number(inRes?.totalAmount ?? 0) || 0;
      const outVal = Number(outRes?.totalAmount ?? 0) || 0;

      setTotalIn(Math.round(inVal * 100) / 100);
      setTotalOut(Math.round(outVal * 100) / 100);
    } catch (e: any) {
      console.error('P&L totals load error:', e);
      setTotalIn(0);
      setTotalOut(0);
      const msg = e?.message || '';
      if (/HTTP\s(4|5)\d{2}/.test(msg)) {
        present({ message: 'Failed to load Profit & Loss totals', color: 'danger', duration: 1800, position: 'top' });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') || undefined;
      try { const ps = await fetchProjects({ page: 1, pageSize: 200, token }); setProjects(ps.data ?? []); } catch {}
    })();
  }, []);

  useEffect(() => {
    loadTotals();
  }, [projectId, dateFrom, dateTo]);

  const net = totalIn - totalOut;

  function fmt2(v: number) {
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)] py-8">
        <div className="space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold hidden lg:block">Finance / Profit & Loss</div>
          <div className="zynq-muted text-sm hidden lg:block">Home &gt; Finance &gt; Profit & Loss</div>

          <div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 flex items-center gap-2"
              onClick={() => navigate('/finance')}
            >
              <IonIcon icon={chevronBackOutline} />
              <span>Back</span>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-1">
                <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">All</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom((e.target as HTMLInputElement).value)} />
                <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo((e.target as HTMLInputElement).value)} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader>
                <CardTitle>Inflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-[color:var(--success)]">
                  {loading ? '…' : fmt2(totalIn)}
                </div>
                <div className="zynq-muted text-sm">Sum of received amounts</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-[color:var(--danger)]">
                  {loading ? '…' : fmt2(totalOut)}
                </div>
                <div className="zynq-muted text-sm">Sum of expenses</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Net</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-semibold ${
                    net < 0
                      ? 'text-[color:var(--danger)]'
                      : net > 0
                        ? 'text-[color:var(--success)]'
                        : ''
                  }`}
                >
                  {loading ? '…' : fmt2(net)}
                </div>
                <div className="zynq-muted text-sm">Inflows - Expenses</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

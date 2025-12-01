import React, { useMemo, useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Nav from '../components/Nav';
import { useAuth } from '../auth/AuthContext';
import { getInvoicesReceivedTotal, getUnifiedExpensesTotal } from '../api/financeService';
import { fetchEmployees } from '../api/hrService';
import { fetchProjects } from '../api/projectsService';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Select from '../ui/Select';
import { tooltipStyle, legendWrapperStyle } from '../ui/ChartTheme';

export default function Dashboard() {
  const { role } = useAuth();
  const upperRole = (role || '').toUpperCase();
  const canViewActivities = upperRole === 'ADMIN' || upperRole === 'GM';
  const [monthly, setMonthly] = useState<{ m: string; revenue: number; expenses: number; cash: number }[]>([]);
  const [kpis, setKpis] = useState({
    rev: { value: 0, delta: 0, up: false },
    exp: { value: 0, delta: 0, up: false },
    profit: { value: 0, delta: 0, up: false },
    cash: { value: 0, delta: 0, up: false },
  });
  const [employees, setEmployees] = useState({ total: 0, present: 0, onLeave: 0 });
  const [projects, setProjects] = useState<{ total: number; byStatus: { name: string; value: number }[] }>({ total: 0, byStatus: [] });
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);
  const yearOptions = useMemo(() => {
    return ['all', ...Array.from({ length: 5 }, (_, idx) => currentYear - idx)];
  }, [currentYear]);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') || undefined;
      const now = new Date();
      const isAllYears = selectedYear === 'all';

      const { dateFrom, dateTo, prevDateFrom, prevDateTo } = (() => {
        if (isAllYears) {
          return { dateFrom: undefined, dateTo: undefined, prevDateFrom: undefined, prevDateTo: undefined };
        }
        const yearValue = selectedYear as number;
        const isCurrentYear = yearValue === now.getFullYear();
        const yearStart = new Date(yearValue, 0, 1);
        const yearEnd = isCurrentYear ? now : new Date(yearValue, 11, 31);
        const endMonth = yearEnd.getMonth();
        const endDay = yearEnd.getDate();

        // Last period = last year YTD (same dates but previous year)
        const prevYear = yearValue - 1;
        const prevYearStart = new Date(prevYear, 0, 1);
        const prevEndDay = Math.min(endDay, new Date(prevYear, endMonth + 1, 0).getDate());
        const prevYearEnd = new Date(prevYear, endMonth, prevEndDay);

        return {
          dateFrom: yearStart.toISOString().slice(0, 10),
          dateTo: yearEnd.toISOString().slice(0, 10),
          prevDateFrom: prevYearStart.toISOString().slice(0, 10),
          prevDateTo: prevYearEnd.toISOString().slice(0, 10),
        };
      })();

      try {
        // Finance aggregates: Revenue (invoices received) and unified expenses (same as Profit & Loss)
        const [
          revRes,
          expRes,
          prevRevRes,
          prevExpRes,
        ] = await Promise.all([
          getInvoicesReceivedTotal({ dateFrom, dateTo, token }),
          getUnifiedExpensesTotal({ dateFrom, dateTo, token }),
          prevDateFrom && prevDateTo
            ? getInvoicesReceivedTotal({ dateFrom: prevDateFrom, dateTo: prevDateTo, token })
            : Promise.resolve({ totalAmount: 0 }),
          prevDateFrom && prevDateTo
            ? getUnifiedExpensesTotal({ dateFrom: prevDateFrom, dateTo: prevDateTo, token })
            : Promise.resolve({ totalAmount: 0 }),
        ]);

        const revTotal = Number(revRes?.totalAmount ?? 0) || 0;
        const expTotal = Number(expRes?.totalAmount ?? 0) || 0;
        const profitTotal = revTotal - expTotal;

        const prevRevTotal = Number(prevRevRes?.totalAmount ?? 0) || 0;
        const prevExpTotal = Number(prevExpRes?.totalAmount ?? 0) || 0;
        const prevProfitTotal = prevRevTotal - prevExpTotal;

        // Simple YTD "cash" proxy: revenue - expenses (same as profit for now)
        const cashTotal = profitTotal;
        const prevCashTotal = prevProfitTotal;

        function pctChange(current: number, previous: number): { delta: number; up: boolean } {
          if (!previous) {
            return { delta: 0, up: false };
          }
          const raw = ((current - previous) / previous) * 100;
          const rounded = Math.round(raw * 100) / 100;
          return { delta: rounded, up: rounded > 0 };
        }

        const revDelta = pctChange(revTotal, prevRevTotal);
        const expDelta = pctChange(expTotal, prevExpTotal);
        const profitDelta = pctChange(profitTotal, prevProfitTotal);
        const cashDelta = pctChange(cashTotal, prevCashTotal);

        // Build a single YTD point for charts; if you later add monthly backend aggregates,
        // this can be expanded to one point per month without changing chart layout.
        setMonthly([
          {
            m: isAllYears ? 'All' : `${selectedYear}`,
            revenue: revTotal,
            expenses: expTotal,
            cash: cashTotal,
          },
        ]);

        setKpis({
          rev: { value: revTotal, delta: revDelta.delta, up: revDelta.up },
          exp: { value: expTotal, delta: expDelta.delta, up: expDelta.up },
          profit: { value: profitTotal, delta: profitDelta.delta, up: profitDelta.up },
          cash: { value: cashTotal, delta: cashDelta.delta, up: cashDelta.up },
        });
      } catch (e) {
        console.error('Dashboard finance load error:', e);
      }

      try {
        // Employees: derive counts directly from HR > Employees statuses
        const empRes = await fetchEmployees({ page: 1, pageSize: 1_000_000, token });
        const rows = (empRes as any)?.data || [];
        const totalEmployees = (empRes as any)?.total ?? rows.length;
        const presentCount = rows.filter((e: any) => (e.status || '').toUpperCase() === 'ACTIVE').length;
        const onLeaveCount = rows.filter((e: any) => (e.status || '').toUpperCase() === 'INACTIVE').length;

        setEmployees({ total: totalEmployees, present: presentCount, onLeave: onLeaveCount });
      } catch (e) {
        console.error('Dashboard HR load error:', e);
      }

      try {
        const projRes = await fetchProjects({ page: 1, pageSize: 1_000_000, token });
        const rows = projRes?.data || [];
        const total = projRes?.total ?? rows.length;
        const byStatusMap: Record<string, number> = {};
        for (const p of rows) {
          const s = (p.status || 'Unknown').trim() || 'Unknown';
          byStatusMap[s] = (byStatusMap[s] || 0) + 1;
        }
        const byStatus = Object.entries(byStatusMap).map(([name, value]) => ({ name, value }));
        setProjects({ total, byStatus });
      } catch (e) {
        console.error('Dashboard projects load error:', e);
      }
    })();
  }, [selectedYear]);

  const statusColors = ['#60a5fa', '#34d399', '#f59e0b', '#a78bfa'];

  return (
    <IonPage>
      <Nav />
      <IonContent className="py-6 bg-[color:var(--bg)] text-[color:var(--text-primary)]">
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold mb-2 hidden lg:block">Dashboard Overview</div>
          <div className="zynq-muted text-sm hidden lg:block">Home &gt; Dashboard</div>
          {canViewActivities && (
            <div className="flex flex-wrap gap-2 items-center">
              <IonButton size="small" color="medium" routerLink="/dashboard/activities" className="w-full sm:w-auto justify-center">Recent Activities</IonButton>
              <div className="min-w-[170px] w-full sm:w-auto">
                <Select
                  label="Year"
                  value={selectedYear}
                  onChange={(e) => {
                    const value = (e.target as HTMLSelectElement).value;
                    setSelectedYear(value === 'all' ? 'all' : Number(value));
                  }}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year === 'all' ? 'All Years' : year}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Revenue (YTD)', value: kpis.rev.value, trend: kpis.rev },
              { label: 'Expenses (YTD)', value: kpis.exp.value, trend: kpis.exp, danger: true },
              { label: 'Profit (YTD)', value: kpis.profit.value, trend: kpis.profit },
              { label: 'Cash Flow (YTD)', value: kpis.cash.value, trend: kpis.cash },
            ].map((card) => (
              <Card key={card.label}>
                <CardHeader className="text-sm zynq-muted">{card.label}</CardHeader>
                <CardContent>
                  <div className={`text-3xl font-semibold ${card.danger ? 'text-[color:var(--danger)]' : ''}`}>
                    {card.value.toLocaleString()}
                  </div>
                  <div className={`mt-1 text-sm flex items-center gap-2 ${card.trend.up ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]'}`}>
                    <span className="inline-block rounded-full px-2 py-0.5 bg-[color:var(--surface)] zynq-border border">
                      {card.trend.up ? '▲' : '▼'} {card.trend.delta}%
                    </span>
                    vs last period
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4 xl:mt-6 mb-4 xl:mb-6">
            <Card className="h-72 flex flex-col">
              <CardTitle className="mb-2">Revenue vs Expenses</CardTitle>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--tw-prose-hr)" />
                    <XAxis dataKey="m" stroke="currentColor" />
                    <YAxis stroke="currentColor" />
                    <Tooltip contentStyle={tooltipStyle()} wrapperStyle={legendWrapperStyle()} />
                    <Legend wrapperStyle={legendWrapperStyle()} />
                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="h-72 flex flex-col">
              <CardTitle className="mb-2">Cash Flow</CardTitle>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--tw-prose-hr)" />
                    <XAxis dataKey="m" stroke="currentColor" />
                    <YAxis stroke="currentColor" />
                    <Tooltip contentStyle={tooltipStyle()} wrapperStyle={legendWrapperStyle()} />
                    <Bar dataKey="cash" fill="#60a5fa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Summaries */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Employees summary */}
            <Card>
              <CardTitle className="mb-2">Employees</CardTitle>
              <div className="text-sm opacity-70">Total</div>
              <div className="text-xl font-semibold">{employees.total}</div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md p-2 bg-[color:var(--surface)] zynq-border border">Present: {employees.present}</div>
                <div className="rounded-md p-2 bg-[color:var(--surface)] zynq-border border">On Leave: {employees.onLeave}</div>
              </div>

              {/* Attendance mini-bar and percentages */}
              {employees.total > 0 ? (
                (() => {
                  const presentPct = Math.round((employees.present / employees.total) * 100);
                  const leavePct = Math.max(0, 100 - presentPct);
                  return (
                    <>
                      <div className="mt-3 text-xs opacity-70">Attendance overview</div>
                      <div className="mt-1 h-2 w-full bg-[color:var(--surface)] rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${presentPct}%` }} />
                      </div>
                      <div className="mt-1 text-xs flex justify-between opacity-70">
                        <span>Present {presentPct}%</span>
                        <span>On Leave {leavePct}%</span>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="mt-3 text-xs opacity-70">No employees data available</div>
              )}
            </Card>

            {/* Project status summary (count only) */}
            <Card className="xl:col-span-2">
              <CardTitle className="mb-2">Project Status</CardTitle>
              <div className="text-sm opacity-70">Total projects</div>
              <div className="text-2xl font-semibold">{projects.total}</div>

              {projects.byStatus && projects.byStatus.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {projects.byStatus.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between rounded-md px-2 py-1 bg-[color:var(--surface)] zynq-border border"
                    >
                      <span>{s.name}</span>
                      <span className="font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-sm opacity-70">No project data available</div>
              )}
            </Card>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

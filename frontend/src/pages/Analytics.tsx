import React, { useEffect, useMemo, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonToast, IonButton } from '@ionic/react';
import Nav from '../components/Nav';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';
import { tooltipStyle, legendWrapperStyle } from '../ui/ChartTheme';
import { useQueryParam } from '../hooks/useQueryParam';
import { fetchAnalytics, AnalyticsResult } from '../api/analyticsService';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function genSeries(seed = 1) {
  return [] as any[];
}

export default function Analytics() {
  const [present] = useIonToast();
  useEffect(() => {
    console.log('Loaded Analytics > Overview page');
  }, []);
  const [range, setRange] = useQueryParam<'YTD' | '6M' | '3M'>('range', 'YTD');
  const [segment, setSegment] = useQueryParam<'All' | 'Projects' | 'HR' | 'Finance'>('segment', 'All');

  const [data, setData] = useState<any[]>([]);
  const kpis = useMemo(() => {
    const rev = data.reduce((s, r) => s + r.revenue, 0);
    const exp = data.reduce((s, r) => s + r.expenses, 0);
    const hrs = data.reduce((s, r) => s + r.hours, 0);
    const margin = rev === 0 ? 0 : Math.round(((rev - exp) / rev) * 100);
    return { rev, exp, hrs, margin };
  }, [data]);

  useEffect(() => {
    (async () => {
      try {
        const res: AnalyticsResult = await fetchAnalytics({ range, segment });
        setData(res.series);
      } catch (_) {
        present({ message: 'Failed to load analytics.', color: 'danger', duration: 2000, position: 'top' });
        setData([]);
      }
    })();
  }, [range, segment]);

  function resetFilters() {
    setRange('YTD');
    setSegment('All');
  }

  function exportCsv() {
    const rows = data.map((d) => ({ month: d.month, revenue: d.revenue, expenses: d.expenses, hours: d.hours }));
    const csv = ['month,revenue,expenses,hours', ...rows.map(r => `${r.month},${r.revenue},${r.expenses},${r.hours}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'analytics.csv'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-6">
        <div className="text-lg font-semibold">Analytics</div>
        <div className="zynq-muted text-sm">Home &gt; Analytics</div>
        <div className="flex flex-wrap gap-2">
          <IonButton size="small" color="medium" routerLink="/analytics/overview">Overview</IonButton>
          <IonButton size="small" color="medium" routerLink="/analytics/financial">Financial</IonButton>
          <IonButton size="small" color="medium" routerLink="/analytics/employee">Employee</IonButton>
          <IonButton size="small" color="medium" routerLink="/analytics/projects">Project Performance</IonButton>
          <IonButton size="small" color="medium" routerLink="/analytics/reports">Reports</IonButton>
          <IonButton size="small" color="medium" routerLink="/analytics/custom">Custom Builder</IonButton>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={range} onChange={(e) => setRange(e.target.value as any)}>
            <option value="YTD">Year to Date</option>
            <option value="6M">Last 6 months</option>
            <option value="3M">Last 3 months</option>
          </Select>
          <Select value={segment} onChange={(e) => setSegment(e.target.value as any)}>
            <option value="All">All</option>
            <option value="Projects">Projects</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
          </Select>
          <div className="flex-1" />
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={resetFilters}>Reset Filters</Button>
            <Button variant="secondary" size="sm" onClick={exportCsv}>Export CSV</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card><CardHeader className="text-sm zynq-muted">Revenue</CardHeader><CardContent className="text-2xl font-semibold">{kpis.rev.toLocaleString()}</CardContent></Card>
          <Card><CardHeader className="text-sm zynq-muted">Expenses</CardHeader><CardContent className="text-2xl font-semibold">{kpis.exp.toLocaleString()}</CardContent></Card>
          <Card><CardHeader className="text-sm zynq-muted">Hours</CardHeader><CardContent className="text-2xl font-semibold">{kpis.hrs.toLocaleString()}</CardContent></Card>
          <Card><CardHeader className="text-sm zynq-muted">Margin</CardHeader><CardContent className="text-2xl font-semibold">{kpis.margin}%</CardContent></Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: 8, right: 8 }}>
                  <XAxis dataKey="month" stroke="var(--border-strong)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis stroke="var(--border-strong)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Legend wrapperStyle={legendWrapperStyle()} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expenses" stroke="var(--muted)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Utilization (Hours)</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ left: 8, right: 8 }}>
                  <XAxis dataKey="month" stroke="var(--border-strong)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis stroke="var(--border-strong)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Bar dataKey="hours" fill="var(--accent)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Cumulative Margin</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ left: 8, right: 8 }}>
                  <XAxis dataKey="month" stroke="var(--border-strong)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis stroke="var(--border-strong)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Area type="monotone" dataKey={(d: any) => Math.round(((d.revenue - d.expenses)/Math.max(1,d.revenue))*100)} stroke="var(--success)" fill="var(--success)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </IonContent>
    </IonPage>
  );
}

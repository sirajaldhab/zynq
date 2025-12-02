import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { IonContent, IonPage, useIonToast, IonButton } from '@ionic/react';
import Nav from '../components/Nav';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';
import { tooltipStyle, legendWrapperStyle } from '../ui/ChartTheme';
import { useQueryParam } from '../hooks/useQueryParam';
import { fetchAnalytics } from '../api/analyticsService';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function genSeries(seed = 1) {
    return [];
}
export default function Analytics() {
    const [present] = useIonToast();
    useEffect(() => {
        console.log('Loaded Analytics > Overview page');
    }, []);
    const [range, setRange] = useQueryParam('range', 'YTD');
    const [segment, setSegment] = useQueryParam('segment', 'All');
    const [data, setData] = useState([]);
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
                const res = await fetchAnalytics({ range, segment });
                setData(res.series);
            }
            catch (_) {
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
        a.href = url;
        a.download = 'analytics.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-6", children: [_jsx("div", { className: "text-lg font-semibold", children: "Analytics" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Analytics" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(IonButton, { size: "small", color: "medium", routerLink: "/analytics/overview", children: "Overview" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/analytics/financial", children: "Financial" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/analytics/employee", children: "Employee" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/analytics/projects", children: "Project Performance" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/analytics/reports", children: "Reports" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/analytics/custom", children: "Custom Builder" })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsxs(Select, { value: range, onChange: (e) => setRange(e.target.value), children: [_jsx("option", { value: "YTD", children: "Year to Date" }), _jsx("option", { value: "6M", children: "Last 6 months" }), _jsx("option", { value: "3M", children: "Last 3 months" })] }), _jsxs(Select, { value: segment, onChange: (e) => setSegment(e.target.value), children: [_jsx("option", { value: "All", children: "All" }), _jsx("option", { value: "Projects", children: "Projects" }), _jsx("option", { value: "HR", children: "HR" }), _jsx("option", { value: "Finance", children: "Finance" })] }), _jsx("div", { className: "flex-1" }), _jsxs("div", { className: "flex gap-2 ml-auto", children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: resetFilters, children: "Reset Filters" }), _jsx(Button, { variant: "secondary", size: "sm", onClick: exportCsv, children: "Export CSV" })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "Revenue" }), _jsx(CardContent, { className: "text-2xl font-semibold", children: kpis.rev.toLocaleString() })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "Expenses" }), _jsx(CardContent, { className: "text-2xl font-semibold", children: kpis.exp.toLocaleString() })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "Hours" }), _jsx(CardContent, { className: "text-2xl font-semibold", children: kpis.hrs.toLocaleString() })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "Margin" }), _jsxs(CardContent, { className: "text-2xl font-semibold", children: [kpis.margin, "%"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "flex items-center justify-between", children: _jsx(CardTitle, { children: "Revenue vs Expenses" }) }), _jsx(CardContent, { style: { height: 320 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: data, margin: { left: 8, right: 8 }, children: [_jsx(XAxis, { dataKey: "month", stroke: "var(--border-strong)", tick: { fill: 'var(--text-secondary)', fontSize: 12 } }), _jsx(YAxis, { stroke: "var(--border-strong)", tick: { fill: 'var(--text-secondary)', fontSize: 12 } }), _jsx(Tooltip, { contentStyle: tooltipStyle() }), _jsx(Legend, { wrapperStyle: legendWrapperStyle() }), _jsx(Line, { type: "monotone", dataKey: "revenue", stroke: "var(--primary)", strokeWidth: 2, dot: false }), _jsx(Line, { type: "monotone", dataKey: "expenses", stroke: "var(--muted)", strokeWidth: 2, dot: false })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "flex items-center justify-between", children: _jsx(CardTitle, { children: "Utilization (Hours)" }) }), _jsx(CardContent, { style: { height: 320 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: data, margin: { left: 8, right: 8 }, children: [_jsx(XAxis, { dataKey: "month", stroke: "var(--border-strong)", tick: { fill: 'var(--text-secondary)', fontSize: 12 } }), _jsx(YAxis, { stroke: "var(--border-strong)", tick: { fill: 'var(--text-secondary)', fontSize: 12 } }), _jsx(Tooltip, { contentStyle: tooltipStyle() }), _jsx(Bar, { dataKey: "hours", fill: "var(--accent)", radius: [6, 6, 0, 0] })] }) }) })] }), _jsxs(Card, { className: "xl:col-span-2", children: [_jsx(CardHeader, { className: "flex items-center justify-between", children: _jsx(CardTitle, { children: "Cumulative Margin" }) }), _jsx(CardContent, { style: { height: 320 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: data, margin: { left: 8, right: 8 }, children: [_jsx(XAxis, { dataKey: "month", stroke: "var(--border-strong)", tick: { fill: 'var(--text-secondary)', fontSize: 12 } }), _jsx(YAxis, { stroke: "var(--border-strong)", tick: { fill: 'var(--text-secondary)', fontSize: 12 } }), _jsx(Tooltip, { contentStyle: tooltipStyle() }), _jsx(Area, { type: "monotone", dataKey: (d) => Math.round(((d.revenue - d.expenses) / Math.max(1, d.revenue)) * 100), stroke: "var(--success)", fill: "var(--success)", fillOpacity: 0.15, strokeWidth: 2 })] }) }) })] })] })] })] }));
}

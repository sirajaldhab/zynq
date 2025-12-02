import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { IonPage, IonContent, IonIcon, useIonToast } from '@ionic/react';
import { useParams, useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { chevronBackOutline } from 'ionicons/icons';
import { fetchProjects } from '../../api/projectsService';
import { fetchMaterials } from '../../api/materialsService';
import { fetchInvoices } from '../../api/financeService';
import { fetchAttendance } from '../../api/hrService';
import { fetchSiteDaySalaries } from '../../api/hrProjectSalaryService';
import { fetchManpowerRecords } from '../../api/manpowerRecordsService';
import { fetchProjectExtra, saveProjectExtra } from '../../api/projectExtrasService';
export default function ProjectView() {
    const { id: projectId } = useParams();
    const navigate = useNavigate();
    const [present] = useIonToast();
    const [project, setProject] = useState(undefined);
    const [materialTotal, setMaterialTotal] = useState(null);
    const [receivedTotal, setReceivedTotal] = useState(null);
    const [manpowerGrandTotal, setManpowerGrandTotal] = useState(null);
    const [otherText, setOtherText] = useState('');
    const [otherInitialLoaded, setOtherInitialLoaded] = useState(false);
    const [savingOther, setSavingOther] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            try {
                const res = await fetchProjects({ page: 1, pageSize: 1000, token });
                const found = (res.data || []).find((p) => p.id === projectId);
                setProject(found || null);
            }
            catch (_) {
                present({ message: 'Failed to load project.', color: 'danger', duration: 2000, position: 'top' });
                setProject(null);
            }
        })();
    }, [projectId]);
    // Load per-project "Other" data
    useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            if (!projectId) {
                setOtherText('');
                setOtherInitialLoaded(false);
                return;
            }
            try {
                const res = await fetchProjectExtra({ projectId, token });
                setOtherText((res && res.otherText) || '');
                setOtherInitialLoaded(true);
            }
            catch (_) {
                setOtherText('');
                setOtherInitialLoaded(true);
            }
        })();
    }, [projectId]);
    // Compute Manpower grand total for the current project using the
    // same logic as HR > Project-Wise Report, matched strictly by site.
    useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            if (!projectId || !project || !project.site) {
                setManpowerGrandTotal(null);
                return;
            }
            const targetSite = String(project.site || '').trim();
            if (!targetSite) {
                setManpowerGrandTotal(null);
                return;
            }
            try {
                // 1) Aggregate attendance for just this site's records
                const presentCounts = {};
                const halfDayCounts = {};
                const otSums = {};
                let page = 1;
                const pageSize = 1000;
                while (true) {
                    const attRes = await fetchAttendance({ page, pageSize, token });
                    const rows = (attRes?.data || attRes?.rows || []);
                    if (!rows.length)
                        break;
                    for (const r of rows) {
                        const status = String(r.status || '').toUpperCase();
                        const site = String(r.location || '').trim();
                        if (!site || site !== targetSite)
                            continue;
                        if (status === 'P' || status === 'PRESENT') {
                            presentCounts[site] = (presentCounts[site] || 0) + 1;
                        }
                        else if (status === 'HALF DAY' || status === 'HALF-DAY') {
                            halfDayCounts[site] = (halfDayCounts[site] || 0) + 1;
                        }
                        const otRaw = r.otHours;
                        const otVal = typeof otRaw === 'number' ? otRaw : Number(otRaw || 0);
                        if (!Number.isNaN(otVal) && otVal !== 0) {
                            otSums[site] = (otSums[site] || 0) + otVal;
                        }
                    }
                    if (rows.length < pageSize)
                        break;
                    page += 1;
                }
                const presentCount = presentCounts[targetSite] || 0;
                const halfDayCount = halfDayCounts[targetSite] || 0;
                const otSum = otSums[targetSite] || 0;
                // 2) Find day salary for this site
                const salaryRes = await fetchSiteDaySalaries({ token });
                const salaryRows = salaryRes.data || [];
                let daySalaryNumber = 0;
                for (const row of salaryRows) {
                    const siteName = String(row.site || '').trim();
                    if (siteName === targetSite) {
                        daySalaryNumber = Number(row.daySalary || 0);
                    }
                }
                // 3) Aggregate external labour total for this site
                const manpowerRecords = (await fetchManpowerRecords({ token })) || [];
                let externalLabours = 0;
                for (const r of manpowerRecords) {
                    const siteName = String(r.site || '').trim();
                    if (!siteName || siteName !== targetSite)
                        continue;
                    const totalVal = Number(r.total || 0);
                    if (!Number.isFinite(totalVal) || totalVal === 0)
                        continue;
                    externalLabours += totalVal;
                }
                // 4) Compute Total and Grand Total using the same formula
                const totalInternal = daySalaryNumber
                    ? daySalaryNumber * (presentCount + halfDayCount * 0.5 + otSum)
                    : 0;
                const grandTotal = totalInternal + externalLabours;
                setManpowerGrandTotal(grandTotal === 0 ? null : grandTotal);
            }
            catch (_) {
                setManpowerGrandTotal(null);
            }
        })();
    }, [projectId, project]);
    useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            if (!projectId) {
                setMaterialTotal(null);
                return;
            }
            try {
                const res = await fetchMaterials({ projectId, token });
                const data = (Array.isArray(res) ? res : res.data) || [];
                const sum = data.reduce((acc, r) => acc + (typeof r.total === 'number' ? r.total : Number(r.total || 0)), 0);
                setMaterialTotal(sum);
            }
            catch (_) {
                setMaterialTotal(null);
            }
        })();
    }, [projectId]);
    useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            if (!projectId) {
                setReceivedTotal(null);
                return;
            }
            try {
                let page = 1;
                const pageSize = 100;
                let sum = 0;
                while (true) {
                    const res = await fetchInvoices({ page, pageSize, token });
                    const data = (res.rows ?? res.data ?? []);
                    if (!data.length)
                        break;
                    for (const inv of data) {
                        const invProjectId = inv.projectId || inv.project?.id;
                        const status = String(inv.status || '').toLowerCase();
                        const isReceived = status === 'received' || status === 'paid';
                        if (isReceived && invProjectId === projectId) {
                            const s = Number(inv.subtotal || 0);
                            const v = Number(inv.vat != null
                                ? inv.vat
                                : Math.round(s * 0.05 * 100) / 100);
                            sum += s + v;
                        }
                    }
                    if (data.length < pageSize)
                        break;
                    page += 1;
                }
                setReceivedTotal(sum);
            }
            catch (_) {
                setReceivedTotal(null);
            }
        })();
    }, [projectId]);
    async function handleSaveOther() {
        if (!projectId)
            return;
        const token = localStorage.getItem('token') || undefined;
        setSavingOther(true);
        try {
            await saveProjectExtra({ projectId, otherText: otherText.trim(), token });
            present({ message: 'Other details saved.', color: 'success', duration: 1500, position: 'top' });
        }
        catch (_) {
            present({ message: 'Failed to save Other details.', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setSavingOther(false);
        }
    }
    const numericOther = otherText === '' ? 0 : Number(otherText);
    const profitLoss = receivedTotal != null && materialTotal != null && manpowerGrandTotal != null && !Number.isNaN(numericOther)
        ? receivedTotal - materialTotal - manpowerGrandTotal - numericOther
        : null;
    const notFound = project === null;
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)]", children: _jsx("div", { className: "px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "mx-auto w-full max-w-screen-md lg:max-w-none pt-6 pb-4 space-y-4", children: [_jsxs("div", { className: "lg:hidden space-y-1", children: [_jsx("div", { className: "text-base font-semibold", children: "Project Details" }), _jsx("div", { className: "text-xs uppercase tracking-wide text-[color:var(--text-secondary)]", children: "Projects / View" })] }), _jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [_jsx("div", { className: "text-lg font-semibold hidden lg:block", children: "Project Details" }), _jsxs(Button, { variant: "secondary", size: "sm", className: "flex items-center gap-2 w-full sm:w-auto justify-center", onClick: () => navigate('/projects'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] })] }), _jsx("div", { className: "zynq-muted text-sm hidden lg:block", children: "Home > Projects > View" }), project === undefined ? (_jsx("div", { className: "mt-4 text-sm", children: "Loading..." })) : notFound ? (_jsx("div", { className: "mt-4 text-sm font-medium", children: "Project not found" })) : (_jsxs("div", { className: "mt-4 space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "flex items-center justify-between", children: _jsx(CardTitle, { children: "Project Details" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "space-y-1", children: _jsx("div", { className: "text-base font-semibold", children: project.name }) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Company" }), _jsx("div", { className: "zynq-muted", children: project.company?.name || '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Main Contractor" }), _jsx("div", { className: "zynq-muted", children: project.main_contractor || '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Project Manager" }), _jsx("div", { className: "zynq-muted", children: project.project_manager_id || '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Client" }), _jsx("div", { className: "zynq-muted", children: project.client?.name || project.clientId || '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Project Name" }), _jsx("div", { className: "zynq-muted", children: project.name })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Site" }), _jsx("div", { className: "zynq-muted", children: project.site || '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Type" }), _jsx("div", { className: "zynq-muted", children: project.parentId ? 'Sub' : 'Main' })] })] }), _jsx("div", { className: "flex flex-col sm:flex-row sm:justify-end", children: _jsx(Button, { size: "sm", onClick: () => navigate(`/projects/${project.id}/material-delivery`, { state: { projectName: project.name } }), className: "font-semibold sm:w-auto w-full", children: "Go to Material Delivery" }) })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Received Amount" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-lg font-semibold text-green-600 dark:text-green-400", children: receivedTotal !== null
                                                                ? receivedTotal.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })
                                                                : '—' }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Material Delivery" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-lg font-semibold text-red-600 dark:text-red-400", children: materialTotal !== null
                                                                ? materialTotal.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })
                                                                : '—' }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Manpower" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-lg font-semibold text-red-600 dark:text-red-400", children: manpowerGrandTotal !== null
                                                                ? manpowerGrandTotal.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })
                                                                : '—' }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Other" }) }), _jsxs(CardContent, { children: [_jsx("input", { type: "number", className: "w-full rounded-md border zynq-border bg-[color:var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-red-600 dark:text-red-400", value: otherText, onChange: (e) => {
                                                                    const v = e.target.value;
                                                                    if (v === '' || !Number.isNaN(Number(v))) {
                                                                        setOtherText(v);
                                                                    }
                                                                }, disabled: !projectId || !otherInitialLoaded || savingOther }), _jsx("div", { className: "flex justify-end mt-2", children: _jsx(Button, { size: "sm", onClick: handleSaveOther, disabled: !projectId || savingOther, children: savingOther ? 'Saving...' : 'Save' }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Profit/Loss" }) }), _jsx(CardContent, { children: _jsx("div", { className: 'text-lg font-bold ' +
                                                                (profitLoss == null
                                                                    ? ''
                                                                    : profitLoss >= 0
                                                                        ? 'text-green-600 dark:text-green-400'
                                                                        : 'text-red-600 dark:text-red-400'), children: profitLoss !== null
                                                                ? profitLoss.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })
                                                                : '—' }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Project Value Breakdown" }) }), _jsx(CardContent, { children: materialTotal == null && manpowerGrandTotal == null && otherText === '' && profitLoss == null ? (_jsx("div", { className: "text-sm zynq-muted", children: "No data available to display chart." })) : (_jsxs("div", { className: "flex flex-col lg:flex-row items-center gap-6", children: [_jsx("div", { className: "w-48 h-48 sm:w-56 sm:h-56 relative", children: (() => {
                                                                const material = materialTotal || 0;
                                                                const manpower = manpowerGrandTotal || 0;
                                                                const other = otherText === '' ? 0 : Number(otherText) || 0;
                                                                const pl = profitLoss ?? 0;
                                                                const values = [material, manpower, other, pl].map((v) => (v < 0 ? 0 : v));
                                                                const total = values.reduce((a, b) => a + b, 0);
                                                                if (!total || !Number.isFinite(total)) {
                                                                    return (_jsx("div", { className: "w-full h-full flex items-center justify-center text-xs zynq-muted", children: "No chart data" }));
                                                                }
                                                                const radius = 36;
                                                                const strokeWidth = 16;
                                                                const circumference = 2 * Math.PI * radius;
                                                                let offset = 0;
                                                                const colors = [
                                                                    // light / dark variants
                                                                    { light: '#3b82f6', dark: '#60a5fa' }, // Material - blue
                                                                    { light: '#f97316', dark: '#fb923c' }, // Manpower - orange
                                                                    { light: '#6b7280', dark: '#9ca3af' }, // Other - gray
                                                                    { light: '#22c55e', dark: '#4ade80' }, // Profit/Loss - green
                                                                ];
                                                                const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                                                                const segments = values.map((value, idx) => {
                                                                    const fraction = value / total;
                                                                    const length = fraction * circumference;
                                                                    const { light: paletteLight, dark: paletteDark } = colors[idx] ?? colors[colors.length - 1] ?? { light: '#ffffff', dark: '#ffffff' };
                                                                    const seg = (_jsx("circle", { cx: "50%", cy: "50%", r: radius, fill: "transparent", stroke: isDark ? paletteDark : paletteLight, strokeWidth: strokeWidth, strokeDasharray: `${length} ${circumference - length}`, strokeDashoffset: -offset }, idx));
                                                                    offset += length;
                                                                    return seg;
                                                                });
                                                                return (_jsxs("svg", { viewBox: "0 0 100 100", className: "w-full h-full", children: [_jsx("g", { transform: "rotate(-90 50 50)", children: segments }), _jsx("circle", { cx: "50", cy: "50", r: radius - strokeWidth, fill: "var(--surface)" })] }));
                                                            })() }), _jsx("div", { className: "flex-1 w-full space-y-2 text-sm", children: (() => {
                                                                const material = materialTotal || 0;
                                                                const manpower = manpowerGrandTotal || 0;
                                                                const other = otherText === '' ? 0 : Number(otherText) || 0;
                                                                const pl = profitLoss ?? 0;
                                                                const items = [
                                                                    { label: 'Material Delivery', value: material, color: 'bg-blue-500 dark:bg-blue-400' },
                                                                    { label: 'Manpower', value: manpower, color: 'bg-orange-500 dark:bg-orange-400' },
                                                                    { label: 'Other', value: other, color: 'bg-gray-500 dark:bg-gray-400' },
                                                                    { label: 'Profit/Loss', value: pl, color: 'bg-green-500 dark:bg-green-400' },
                                                                ];
                                                                const total = items
                                                                    .map((i) => (i.value < 0 ? 0 : i.value))
                                                                    .reduce((a, b) => a + b, 0);
                                                                if (!total || !Number.isFinite(total))
                                                                    return null;
                                                                return items.map((item) => {
                                                                    const safe = item.value < 0 ? 0 : item.value;
                                                                    const pct = total ? (safe / total) * 100 : 0;
                                                                    return (_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `inline-block w-3 h-3 rounded-full ${item.color}` }), _jsx("span", { children: item.label })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "tabular-nums", children: safe.toLocaleString(undefined, {
                                                                                            minimumFractionDigits: 2,
                                                                                            maximumFractionDigits: 2,
                                                                                        }) }), _jsxs("span", { className: "text-xs zynq-muted", children: [pct.toFixed(1), "%"] })] })] }, item.label));
                                                                });
                                                            })() })] })) })] })] }))] }) }) })] }));
}

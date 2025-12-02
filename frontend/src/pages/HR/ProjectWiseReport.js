import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { IonPage, IonContent, useIonToast } from '@ionic/react';
import Nav from '../../components/Nav';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { fetchProjects } from '../../api/projectsService';
import { fetchAttendance } from '../../api/hrService';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { fetchSiteDaySalaries, upsertSiteDaySalary } from '../../api/hrProjectSalaryService';
import { fetchManpowerRecords } from '../../api/manpowerRecordsService';
export default function HRProjectWiseReport() {
    const [present] = useIonToast();
    const [projects, setProjects] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sitePresentMap, setSitePresentMap] = useState({});
    const [siteHalfDayMap, setSiteHalfDayMap] = useState({});
    const [siteOtMap, setSiteOtMap] = useState({});
    const [siteSalaryMap, setSiteSalaryMap] = useState({});
    const [editingSalary, setEditingSalary] = useState({});
    const [savingSite, setSavingSite] = useState(null);
    const [siteExternalLabourMap, setSiteExternalLabourMap] = useState({});
    useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            try {
                // 1) Load projects (for Project/Site list)
                const projRes = await fetchProjects({ page: 1, pageSize: 1000, token });
                const proj = projRes.data || [];
                setProjects(proj);
                // 2) Load all attendance (no date filter) and aggregate Present, Half day, and OT by site/location
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
                        if (!site)
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
                setSitePresentMap(presentCounts);
                setSiteHalfDayMap(halfDayCounts);
                setSiteOtMap(otSums);
                // 3) Load existing per-site day salaries
                const salaryRes = await fetchSiteDaySalaries({ token });
                const salaryRows = salaryRes.data || [];
                const salaryMap = {};
                for (const row of salaryRows) {
                    const key = String(row.site || '').trim();
                    if (!key)
                        continue;
                    // If multiple records accidentally exist, keep the last one; UI will still use a single value.
                    salaryMap[key] = row;
                }
                setSiteSalaryMap(salaryMap);
                // 4) Load manpower supplier records and aggregate external labour totals per site
                const manpowerRecords = (await fetchManpowerRecords({ token })) || [];
                const externalBySite = {};
                for (const r of manpowerRecords) {
                    const siteName = String(r.site || '').trim();
                    if (!siteName)
                        continue;
                    const totalVal = Number(r.total || 0);
                    if (!Number.isFinite(totalVal) || totalVal === 0)
                        continue;
                    externalBySite[siteName] = (externalBySite[siteName] || 0) + totalVal;
                }
                setSiteExternalLabourMap(externalBySite);
            }
            catch (_) {
                setProjects((p) => p || []);
                setSitePresentMap({});
                setSiteHalfDayMap({});
                setSiteOtMap({});
                setSiteSalaryMap({});
                setSiteExternalLabourMap({});
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    async function handleSaveSalary(siteNameRaw) {
        const siteName = siteNameRaw.trim();
        if (!siteName)
            return;
        const value = (editingSalary[siteName] ?? '').trim();
        const num = Number(value || (siteSalaryMap[siteName]?.daySalary ?? 0));
        if (Number.isNaN(num)) {
            present({ message: 'Invalid salary amount', color: 'danger', duration: 1800, position: 'top' });
            return;
        }
        const token = localStorage.getItem('token') || undefined;
        const existing = siteSalaryMap[siteName];
        try {
            setSavingSite(siteName);
            const saved = await upsertSiteDaySalary({
                id: existing?.id,
                site: siteName,
                projectId: existing?.projectId ?? null,
                daySalary: num,
                token,
            });
            setSiteSalaryMap((prev) => ({ ...prev, [siteName]: saved }));
            setEditingSalary((prev) => ({ ...prev, [siteName]: String(saved.daySalary) }));
            present({ message: 'Day salary saved', color: 'success', duration: 1500, position: 'top' });
        }
        catch (_) {
            present({ message: 'Failed to save day salary', color: 'danger', duration: 1800, position: 'top' });
        }
        finally {
            setSavingSite((prev) => (prev === siteName ? null : prev));
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "px-4 py-6 sm:px-6 lg:px-8 bg-[color:var(--bg)] space-y-6", children: [_jsx("div", { className: "text-lg font-semibold hidden lg:block", children: "HR / Project-Wise Report" }), _jsx("div", { className: "zynq-muted text-sm hidden lg:block", children: "Home > HR > Project-Wise Report" }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Project-Wise Report" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "text-sm zynq-muted", children: "This page is reserved for project-wise HR reporting. Implement report content here using the existing design system." }), _jsx("div", { className: "overflow-auto border border-[color:var(--border)] rounded-md", children: _jsxs("table", { className: "min-w-full text-xs sm:text-sm", children: [_jsx("thead", { className: "bg-[color:var(--surface-soft)]", children: _jsxs("tr", { className: "text-left", children: [_jsx("th", { className: "px-3 py-2 font-semibold", children: "Project" }), _jsx("th", { className: "px-3 py-2 font-semibold", children: "Site" }), _jsx("th", { className: "px-3 py-2 font-semibold", children: "Present" }), _jsx("th", { className: "px-3 py-2 font-semibold", children: "Half day" }), _jsx("th", { className: "px-3 py-2 font-semibold", children: "OT (HRS)" }), _jsx("th", { className: "px-3 py-2 font-semibold", children: "Day Salary" }), _jsx("th", { className: "px-3 py-2 font-semibold", children: "Total" }), _jsx("th", { className: "px-3 py-2 font-semibold", children: "External Labours" }), _jsx("th", { className: "px-3 py-2 font-semibold", children: "Grand Total" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { className: "border-t", children: _jsx("td", { className: "px-3 py-2 text-gray-500", colSpan: 9, children: "Loading projects..." }) })) : !projects || projects.length === 0 ? (_jsx("tr", { className: "border-t", children: _jsx("td", { className: "px-3 py-2 text-gray-500", colSpan: 9, children: "No projects found." }) })) : (projects.map((p) => {
                                                        const siteName = (p.site || '').trim();
                                                        const presentCount = siteName ? sitePresentMap[siteName] || 0 : 0;
                                                        const halfDayCount = siteName ? siteHalfDayMap[siteName] || 0 : 0;
                                                        const otSum = siteName ? siteOtMap[siteName] || 0 : 0;
                                                        const salaryRow = siteName ? siteSalaryMap[siteName] : undefined;
                                                        const salaryValue = siteName
                                                            ? editingSalary[siteName] ?? (salaryRow ? String(salaryRow.daySalary) : '')
                                                            : '';
                                                        const daySalaryNumber = siteName ? (salaryRow ? Number(salaryRow.daySalary || 0) : 0) : 0;
                                                        const externalLabours = siteName ? siteExternalLabourMap[siteName] || 0 : 0;
                                                        const totalInternal = siteName
                                                            ? daySalaryNumber * (presentCount + halfDayCount * 0.5 + otSum)
                                                            : 0;
                                                        const grandTotal = siteName ? totalInternal + externalLabours : 0;
                                                        const isSaving = savingSite === siteName;
                                                        return (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "px-3 py-2", children: p.name }), _jsx("td", { className: "px-3 py-2", children: siteName || '—' }), _jsx("td", { className: "px-3 py-2", children: siteName ? presentCount : '—' }), _jsx("td", { className: "px-3 py-2", children: siteName ? halfDayCount : '—' }), _jsx("td", { className: "px-3 py-2", children: siteName ? otSum : '—' }), _jsx("td", { className: "px-3 py-2", children: siteName ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { label: "", type: "number", value: salaryValue, onChange: (e) => {
                                                                                    const v = e.target.value;
                                                                                    setEditingSalary((prev) => ({ ...prev, [siteName]: v }));
                                                                                }, className: "h-8 text-xs w-24" }), _jsx(Button, { size: "sm", variant: "secondary", disabled: isSaving, onClick: () => handleSaveSalary(siteName), children: isSaving ? 'Saving...' : 'Save' })] })) : ('—') }), _jsx("td", { className: "px-3 py-2", children: siteName ? totalInternal.toFixed(2) : '—' }), _jsx("td", { className: "px-3 py-2", children: siteName ? externalLabours.toFixed(2) : '—' }), _jsx("td", { className: "px-3 py-2", children: siteName ? grandTotal.toFixed(2) : '—' })] }, p.id));
                                                    })) })] }) })] })] })] })] }));
}

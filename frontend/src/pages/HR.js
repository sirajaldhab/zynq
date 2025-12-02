import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useState, useEffect } from 'react';
import { IonContent, IonPage, useIonToast, IonButton, IonSpinner, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { toCsv, downloadCsv } from '../utils/csv';
import { useQueryParam } from '../hooks/useQueryParam';
import { fetchAttendance } from '../api/hrService';
import { chevronBackOutline } from 'ionicons/icons';
const EMPLOYEES = [];
const PROJECTS = [];
export default function HR() {
    const [present] = useIonToast();
    const navigate = useNavigate();
    useEffect(() => {
        console.log('Loaded HR > Overview page');
    }, []);
    // Attendance state
    const [attSearch, setAttSearch] = useQueryParam('attQ', '');
    const [attStatus, setAttStatus] = useQueryParam('attStatus', 'All');
    const [attProject, setAttProject] = useQueryParam('attProject', 'All');
    const [attPage, setAttPage] = useQueryParam('attPage', 1);
    const [attEmployeeId, setAttEmployeeId] = useQueryParam('attEmp', '');
    const [attStart, setAttStart] = useQueryParam('attStart', '');
    const [attEnd, setAttEnd] = useQueryParam('attEnd', '');
    const attPageSize = 8;
    const [attView, setAttView] = useState(null);
    const [attEdit, setAttEdit] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [attendanceTotal, setAttendanceTotal] = useState(0);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    // Read-only attendance logs grouped by date (for display only)
    const [logsByDate, setLogsByDate] = useState({});
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsMonth, setLogsMonth] = useState(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    });
    const [logsStartDate, setLogsStartDate] = useState('');
    const [logsEndDate, setLogsEndDate] = useState('');
    const [logsProjectFilter, setLogsProjectFilter] = useState('');
    const filteredAttendance = useMemo(() => {
        const q = (attSearch || '').toString().toLowerCase();
        return attendance.filter((r) => {
            const employeeName = (r.employee || '').toString().toLowerCase();
            const projectName = (r.project || '').toString().toLowerCase();
            return ((attStatus === 'All' || r.status === attStatus) &&
                (attProject === 'All' || r.project === attProject) &&
                (employeeName.includes(q) || projectName.includes(q)));
        });
    }, [attendance, attSearch, attStatus, attProject]);
    function workedHours(r) {
        if (!r.checkIn || !r.checkOut)
            return 0;
        const diffMs = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
        return Math.max(0, Math.round((diffMs / 36e5) * 10) / 10); // hours, 1 decimal
    }
    // Derived list of unique SITE / PROJECT values from current logs
    const logsProjectOptions = useMemo(() => Array.from(new Set(Object.values(logsByDate)
        .flat()
        .map((r) => r.siteProject)
        .filter((v) => !!v))).sort(), [logsByDate]);
    // Compute totals for the selected project across all dates
    const logsTotals = useMemo(() => {
        let totalRecords = 0;
        let totalOt = 0;
        const selectedProject = logsProjectFilter || '';
        Object.values(logsByDate).forEach((rows) => {
            rows.forEach((r) => {
                if (!selectedProject || r.siteProject === selectedProject) {
                    totalRecords += 1;
                    const ot = Number(r.otHours || '0');
                    if (!Number.isNaN(ot))
                        totalOt += ot;
                }
            });
        });
        return { totalRecords, totalOt: Math.round(totalOt * 10) / 10 };
    }, [logsByDate, logsProjectFilter]);
    function overtimeHours(r) {
        const h = workedHours(r);
        return h > 8 ? Math.round((h - 8) * 10) / 10 : 0;
    }
    const attTotals = useMemo(() => {
        const present = filteredAttendance.filter((r) => r.status === 'Present');
        const totalHours = present.reduce((s, r) => s + workedHours(r), 0);
        const overtime = present.reduce((s, r) => s + overtimeHours(r), 0);
        const rate = (present.length / Math.max(1, filteredAttendance.length)) * 100;
        return { totalHours: Math.round(totalHours * 10) / 10, overtime: Math.round(overtime * 10) / 10, rate: Math.round(rate) };
    }, [filteredAttendance]);
    const projectHours = useMemo(() => {
        const map = new Map();
        for (const r of filteredAttendance) {
            if (r.status !== 'Present')
                continue;
            map.set(r.project, (map.get(r.project) || 0) + workedHours(r));
        }
        return Array.from(map.entries())
            .map(([project, hours]) => ({ project, hours: Math.round(hours * 10) / 10 }))
            .sort((a, b) => b.hours - a.hours);
    }, [filteredAttendance]);
    // Exports
    function exportAttendanceCsv() {
        const cols = [
            { key: 'date', header: 'Date', map: (r) => new Date(r.date).toISOString() },
            { key: 'employee', header: 'Employee' },
            { key: 'project', header: 'Project' },
            { key: 'status', header: 'Status' },
            { key: 'checkIn', header: 'In', map: (r) => (r.checkIn ? new Date(r.checkIn).toISOString() : '') },
            { key: 'checkOut', header: 'Out', map: (r) => (r.checkOut ? new Date(r.checkOut).toISOString() : '') },
            { key: 'hours', header: 'Hours', map: (r) => (r.status === 'Present' ? workedHours(r).toFixed(1) : '') },
            { key: 'overtime', header: 'OT', map: (r) => (r.status === 'Present' ? overtimeHours(r).toFixed(1) : '') },
        ];
        downloadCsv('attendance.csv', toCsv(filteredAttendance, cols));
    }
    const attendanceColumns = [
        { key: 'date', header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
        { key: 'employee', header: 'Employee' },
        { key: 'project', header: 'Project' },
        { key: 'status', header: 'Status', render: (r) => (_jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${r.status === 'Present' ? 'bg-green-500/10 text-green-500' : r.status === 'Absent' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`, children: r.status })) },
        { key: 'checkIn', header: 'In', render: (r) => (r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—') },
        { key: 'checkOut', header: 'Out', render: (r) => (r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—') },
        { key: 'hours', header: 'Hours', render: (r) => (r.status === 'Present' ? workedHours(r).toFixed(1) : '—') },
        { key: 'overtime', header: 'OT', render: (r) => (r.status === 'Present' ? overtimeHours(r).toFixed(1) : '—') },
        { key: 'actions', header: 'Actions', render: (r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setAttView(r), children: "View" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => setAttEdit(r), children: "Edit" })] })) },
    ];
    const viewAttendance = filteredAttendance;
    React.useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            try {
                setAttendanceLoading(true);
                const res = await fetchAttendance({
                    search: attSearch,
                    status: attStatus,
                    project: attProject,
                    employeeId: attEmployeeId || undefined,
                    start: attStart || undefined,
                    end: attEnd || undefined,
                    page: attPage,
                    pageSize: attPageSize,
                    token,
                });
                const apiRows = (Array.isArray(res) ? res : ((res.data ?? res.rows) || []));
                const mapped = apiRows.map((a) => {
                    const employeeName = a.employeeName ??
                        a.employee_name ??
                        a.employee?.employeeName ??
                        a.employee?.name ??
                        a.employee ??
                        '';
                    const projectName = a.project ??
                        a.projectName ??
                        a.project_name ??
                        '';
                    const rawDate = a.date ?? a.check_in ?? a.checkIn;
                    const dateStr = typeof rawDate === 'string'
                        ? rawDate
                        : rawDate
                            ? new Date(rawDate).toISOString()
                            : new Date().toISOString();
                    return {
                        id: a.id,
                        date: dateStr,
                        employee: String(employeeName ?? ''),
                        project: String(projectName ?? ''),
                        status: a.status ?? 'Present',
                        checkIn: a.checkIn ?? a.check_in ?? undefined,
                        checkOut: a.checkOut ?? a.check_out ?? undefined,
                    };
                });
                setAttendance(mapped);
                const totalCount = Array.isArray(res) ? apiRows.length : res.total ?? apiRows.length;
                setAttendanceTotal(totalCount);
            }
            catch (_) {
                present({ message: 'Failed to load attendance.', color: 'danger', duration: 2000, position: 'top' });
                setAttendance([]);
                setAttendanceTotal(0);
            }
            finally {
                setAttendanceLoading(false);
            }
        })();
    }, [attSearch, attStatus, attProject, attEmployeeId, attStart, attEnd, attPage]);
    // Load full attendance logs for read-only grouped-by-date view
    React.useEffect(() => {
        let cancelled = false;
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            try {
                setLogsLoading(true);
                // Determine date range based on month and optional overrides for this section only
                let rangeStart;
                let rangeEnd;
                if (logsStartDate || logsEndDate || logsMonth) {
                    if (logsStartDate)
                        rangeStart = logsStartDate;
                    if (logsEndDate)
                        rangeEnd = logsEndDate;
                    if (logsMonth) {
                        const [yStr, mStr] = logsMonth.split('-');
                        const y = Number(yStr);
                        const m = Number(mStr || '1') - 1;
                        if (!rangeStart)
                            rangeStart = new Date(y, m, 1).toISOString().slice(0, 10);
                        if (!rangeEnd)
                            rangeEnd = new Date(y, m + 1, 0).toISOString().slice(0, 10);
                    }
                }
                // Fetch a larger page of records for the grouped view within selected range.
                const res = await fetchAttendance({
                    page: 1,
                    pageSize: 2000,
                    start: rangeStart,
                    end: rangeEnd,
                    token,
                });
                if (cancelled)
                    return;
                const raw = (Array.isArray(res) ? res : ((res.data ?? res.rows) || []));
                const normalized = raw.map((a) => {
                    const rawDate = a.date ?? a.check_in ?? a.checkIn;
                    const dStr = rawDate
                        ? (typeof rawDate === 'string' ? rawDate.slice(0, 10) : new Date(rawDate).toISOString().slice(0, 10))
                        : new Date().toISOString().slice(0, 10);
                    // Employee name and Emirates ID from joined employee data when available
                    const employeeName = a.employeeName ??
                        a.employee_name ??
                        a.employee?.employeeName ??
                        a.employee?.name ??
                        '';
                    const emiratesId = a.employee?.emiratesId ??
                        a.emiratesId ??
                        '';
                    const statusRaw = String(a.status ?? '');
                    const statusNorm = statusRaw.toUpperCase() || 'SELECT';
                    const checkIn = a.checkIn ??
                        a.check_in ??
                        '';
                    const checkOut = a.checkOut ??
                        a.check_out ??
                        '';
                    const otHoursRaw = a.otHours;
                    const otHours = typeof otHoursRaw === 'number'
                        ? otHoursRaw.toFixed(1)
                        : otHoursRaw != null && otHoursRaw !== ''
                            ? String(otHoursRaw)
                            : '';
                    const site = a.location ?? '';
                    const projectName = a.project ??
                        a.projectName ??
                        a.project_name ??
                        '';
                    const siteProject = [site, projectName].filter(Boolean).join(' / ');
                    // ApprovedBy and signature are not exposed on AttendanceDto explicitly, so read them if present
                    const approvedBy = String(a.approvedBy || '').trim();
                    const signature = String(a.signature || '').trim();
                    // Best-effort timestamp for tie-breaking: checkIn/check_in/date
                    let createdAtMs;
                    const tsSource = a.checkOut ?? a.check_out ?? a.checkIn ?? a.check_in ?? a.date;
                    if (tsSource) {
                        const d = new Date(tsSource);
                        if (!Number.isNaN(d.getTime()))
                            createdAtMs = d.getTime();
                    }
                    const eidKey = String(emiratesId || '').trim();
                    return {
                        id: a.id,
                        date: dStr,
                        employeeName: String(employeeName || ''),
                        emiratesId: String(emiratesId || ''),
                        status: statusNorm,
                        checkIn,
                        checkOut,
                        otHours,
                        siteProject,
                        approvedBy,
                        signature,
                        _rawStatus: statusRaw,
                        _dateKey: dStr,
                        _eidKey: eidKey,
                        _createdAt: createdAtMs,
                    };
                });
                // Step 2: de-duplicate per (date, Emirates ID)
                const byDate = {};
                const mapPerDateEmp = new Map(); // key: `${date}|${EID}`
                for (const r of normalized) {
                    if (!r._eidKey)
                        continue; // cannot validate without Emirates ID
                    const key = `${r._dateKey}|${r._eidKey}`;
                    const existing = mapPerDateEmp.get(key);
                    if (!existing) {
                        mapPerDateEmp.set(key, r);
                        continue;
                    }
                    // Prefer records with a non-SELECT status over SELECT
                    const existingIsSelect = !existing.status || existing.status === 'SELECT';
                    const currentIsSelect = !r.status || r.status === 'SELECT';
                    if (existingIsSelect && !currentIsSelect) {
                        mapPerDateEmp.set(key, r);
                        continue;
                    }
                    if (!existingIsSelect && currentIsSelect) {
                        continue;
                    }
                    // If both have meaningful statuses or both SELECT, pick the one with the latest timestamp
                    const existingTs = existing._createdAt ?? 0;
                    const currentTs = r._createdAt ?? 0;
                    if (currentTs > existingTs) {
                        mapPerDateEmp.set(key, r);
                    }
                }
                // Step 3: group chosen records by date
                for (const r of mapPerDateEmp.values()) {
                    const dKey = r.date;
                    if (!byDate[dKey])
                        byDate[dKey] = [];
                    byDate[dKey].push({
                        id: r.id,
                        date: r.date,
                        employeeName: r.employeeName,
                        emiratesId: r.emiratesId,
                        status: r.status,
                        checkIn: r.checkIn,
                        checkOut: r.checkOut,
                        otHours: r.otHours,
                        siteProject: r.siteProject,
                        approvedBy: r.approvedBy,
                        signature: r.signature,
                    });
                }
                // Sort rows within each date by employee name for consistent display
                Object.keys(byDate).forEach((d) => {
                    const rows = byDate[d] ?? [];
                    byDate[d] = rows.slice().sort((a, b) => a.employeeName.localeCompare(b.employeeName));
                });
                setLogsByDate(byDate);
            }
            catch {
                if (!cancelled) {
                    setLogsByDate({});
                }
            }
            finally {
                if (!cancelled) {
                    setLogsLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [logsMonth, logsStartDate, logsEndDate]);
    function resetAttendanceFilters() {
        setAttSearch('');
        setAttStatus('All');
        setAttProject('All');
        setAttPage(1);
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "px-4 py-6 sm:px-6 lg:px-8 bg-[color:var(--bg)] space-y-6", children: [_jsx("div", { className: "text-lg font-semibold hidden lg:block", children: "HR" }), _jsx("div", { className: "zynq-muted text-sm hidden lg:block", children: "Home > HR" }), _jsx("div", { className: "hidden lg:block", children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-2", children: [_jsx(IonButton, { size: "small", color: "medium", routerLink: "/hr/attendance", children: "Attendance" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/hr/employees", children: "Employees" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/hr/payroll", children: "Payroll" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/hr/project-wise-report", children: "Project-Wise Report" })] }), _jsxs(Card, { className: "mt-6", children: [_jsx(CardHeader, { className: "flex items-center justify-between", children: _jsx(CardTitle, { children: "Attendance Records by Date" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-5 gap-3", children: [_jsx(Input, { label: "Month", type: "date", value: logsMonth ? `${logsMonth}-01` : '', onChange: (e) => {
                                                    const raw = e.target.value; // YYYY-MM-DD
                                                    if (!raw) {
                                                        setLogsMonth('');
                                                        return;
                                                    }
                                                    const [y, m] = raw.split('-');
                                                    if (!y || !m)
                                                        return;
                                                    setLogsMonth(`${y}-${m}`);
                                                } }), _jsx(Input, { label: "From", type: "date", value: logsStartDate, onChange: (e) => setLogsStartDate(e.target.value) }), _jsx(Input, { label: "To", type: "date", value: logsEndDate, onChange: (e) => setLogsEndDate(e.target.value) }), _jsxs(Select, { label: "Site / Project", value: logsProjectFilter, onChange: (e) => setLogsProjectFilter(e.target.value), children: [_jsx("option", { value: "", children: "All Sites / Projects" }), logsProjectOptions.map((p) => (_jsx("option", { value: p, children: p }, p)))] }), _jsx("div", { className: "flex items-end justify-end", children: _jsx(Button, { variant: "secondary", size: "sm", onClick: () => {
                                                        const now = new Date();
                                                        const y = now.getFullYear();
                                                        const m = String(now.getMonth() + 1).padStart(2, '0');
                                                        setLogsMonth(`${y}-${m}`);
                                                        setLogsStartDate('');
                                                        setLogsEndDate('');
                                                        setLogsProjectFilter('');
                                                    }, children: "Reset Filters" }) })] }), !logsLoading && (_jsxs("div", { className: "text-xs sm:text-sm zynq-muted flex flex-wrap gap-4", children: [_jsxs("span", { children: ["Records: ", _jsx("b", { children: logsTotals.totalRecords })] }), _jsxs("span", { children: ["Total OT (hrs): ", _jsx("b", { children: logsTotals.totalOt.toFixed(1) })] })] })), logsLoading && (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx(IonSpinner, { name: "dots" }) })), !logsLoading && Object.keys(logsByDate).length === 0 && (_jsx("div", { className: "text-sm zynq-muted", children: "No attendance records available." })), !logsLoading && Object.keys(logsByDate).length > 0 && (_jsx("div", { className: "space-y-4", children: Object.keys(logsByDate)
                                            .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
                                            .map((date) => (_jsxs(Card, { className: "border zynq-border bg-[color:var(--surface)]", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: new Date(date).toLocaleDateString() }) }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-auto rounded-xl border zynq-border text-xs sm:text-sm", children: _jsxs("table", { className: "min-w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b zynq-border bg-[color:var(--muted)]/10", children: [_jsx("th", { className: "px-3 py-2 text-left", children: "EMPLOYEE NAME" }), _jsx("th", { className: "px-3 py-2 text-left", children: "EMIRATES ID" }), _jsx("th", { className: "px-3 py-2 text-left", children: "STATUS" }), _jsx("th", { className: "px-3 py-2 text-left", children: "CHECK-IN" }), _jsx("th", { className: "px-3 py-2 text-left", children: "CHECK-OUT" }), _jsx("th", { className: "px-3 py-2 text-left", children: "OT (HRS)" }), _jsx("th", { className: "px-3 py-2 text-left", children: "SITE / PROJECT" }), _jsx("th", { className: "px-3 py-2 text-left", children: "APPROVED BY" }), _jsx("th", { className: "px-3 py-2 text-left", children: "SIGNATURE" })] }) }), _jsx("tbody", { children: (logsByDate[date] || [])
                                                                        .filter((row) => !logsProjectFilter || row.siteProject === logsProjectFilter)
                                                                        .map((row) => (_jsxs("tr", { className: "border-b zynq-border last:border-0", children: [_jsx("td", { className: "px-3 py-2 align-top", children: row.employeeName || '—' }), _jsx("td", { className: "px-3 py-2 align-top", children: row.emiratesId || '—' }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${row.status === 'P' || row.status === 'PRESENT'
                                                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                                                        : row.status === 'A' || row.status === 'ABSENT'
                                                                                            ? 'bg-rose-500/10 text-rose-500'
                                                                                            : row.status === 'HOLIDAY'
                                                                                                ? 'bg-slate-500/10 text-slate-400'
                                                                                                : 'bg-amber-500/10 text-amber-500'}`, children: row.status || 'SELECT' }) }), _jsx("td", { className: "px-3 py-2 align-top", children: row.checkIn
                                                                                    ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                                    : '—' }), _jsx("td", { className: "px-3 py-2 align-top", children: row.checkOut
                                                                                    ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                                    : '—' }), _jsx("td", { className: "px-3 py-2 align-top", children: row.otHours || '—' }), _jsx("td", { className: "px-3 py-2 align-top", children: row.siteProject || '—' }), _jsx("td", { className: "px-3 py-2 align-top", children: row.approvedBy || '—' }), _jsx("td", { className: "px-3 py-2 align-top", children: row.signature || '—' })] }, row.id))) })] }) }) })] }, date))) }))] })] })] })] }));
}
// Modals
function AttendanceViewModal({ row, onClose }) {
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: "Attendance \u2014 View", children: row && (_jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("b", { children: "Date:" }), " ", new Date(row.date).toLocaleDateString()] }), _jsxs("div", { children: [_jsx("b", { children: "Employee:" }), " ", row.employee] }), _jsxs("div", { children: [_jsx("b", { children: "Project:" }), " ", row.project] }), _jsxs("div", { children: [_jsx("b", { children: "Status:" }), " ", row.status] }), _jsxs("div", { children: [_jsx("b", { children: "In:" }), " ", row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : '—'] }), _jsxs("div", { children: [_jsx("b", { children: "Out:" }), " ", row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : '—'] }), _jsxs("div", { children: [_jsx("b", { children: "Hours:" }), " ", row.checkIn && row.checkOut ? (Math.max(0, (new Date(row.checkOut).getTime() - new Date(row.checkIn).getTime()) / 36e5)).toFixed(1) : '—'] }), _jsxs("div", { children: [_jsx("b", { children: "Overtime:" }), " ", row.checkIn && row.checkOut ? (Math.max(0, ((new Date(row.checkOut).getTime() - new Date(row.checkIn).getTime()) / 36e5 - 8))).toFixed(1) : '—'] })] })) }));
}
function AttendanceEditModal({ row, onClose }) {
    const [status, setStatus] = useState(row?.status || 'Present');
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: "Attendance \u2014 Edit", children: row && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "text-sm", children: ["Update status for ", _jsx("b", { children: row.employee }), " (", new Date(row.date).toLocaleDateString(), ")"] }), _jsxs(Select, { value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "Present", children: "Present" }), _jsx("option", { value: "Absent", children: "Absent" }), _jsx("option", { value: "Leave", children: "Leave" })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: onClose, children: "Save" })] })] })) }));
}

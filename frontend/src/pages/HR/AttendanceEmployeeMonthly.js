import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate, useParams } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { fetchEmployees, fetchAttendance, updateAttendance, deleteAttendance, createAttendance } from '../../api/hrService';
import { fetchProjects } from '../../api/projectsService';
import { chevronBackOutline } from 'ionicons/icons';
import { useAuth } from '../../auth/AuthContext';
function todayMonthIso() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}
function extractLocalTime(raw) {
    if (!raw)
        return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime()))
        return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}
function dateOnlyLocal(raw) {
    if (!raw)
        return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime()))
        return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
export default function HRAttendanceEmployeeMonthly() {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const isTeamLeader = (auth.role || '').toUpperCase() === 'TEAM LEADER';
    const [employee, setEmployee] = React.useState(null);
    const [projects, setProjects] = React.useState([]);
    const [rows, setRows] = React.useState([]);
    const [month, setMonth] = React.useState(todayMonthIso);
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [infoMessage, setInfoMessage] = React.useState('');
    const [showValidationErrors, setShowValidationErrors] = React.useState(false);
    const [editingSiteDate, setEditingSiteDate] = React.useState(null);
    const otOptions = React.useMemo(() => ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8'], []);
    // Monthly aggregates for the currently selected month (derived from rows)
    const monthlyTotals = React.useMemo(() => {
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalHoliday = 0;
        let totalHalfDay = 0;
        let totalOt = 0;
        for (const r of rows) {
            const s = String(r.status || '').toUpperCase();
            if (s === 'P' || s === 'PRESENT')
                totalPresent += 1;
            else if (s === 'A' || s === 'ABSENT')
                totalAbsent += 1;
            else if (s === 'HOLIDAY')
                totalHoliday += 1;
            else if (s === 'HALF DAY' || s === 'HALF-DAY')
                totalHalfDay += 1;
            const ot = Number(r.otHours || '0');
            if (!Number.isNaN(ot))
                totalOt += ot;
        }
        return {
            totalPresent,
            totalAbsent,
            totalHoliday,
            totalHalfDay,
            totalOt,
        };
    }, [rows]);
    const mainContractorOptions = React.useMemo(() => Array.from(new Set(projects.map((p) => p.main_contractor || '').filter(Boolean))), [projects]);
    function projectOptionsFor(mainContractor) {
        if (!mainContractor)
            return [];
        return projects.filter((p) => p.main_contractor === mainContractor);
    }
    function siteOptionsFor(mainContractor, projectId) {
        if (!mainContractor || !projectId)
            return [];
        const p = projects.find((x) => x.id === projectId && x.main_contractor === mainContractor);
        const site = p?.site || '';
        return site ? [site] : [];
    }
    function getCurrentUserName() {
        const token = auth.accessToken || localStorage.getItem('accessToken');
        if (!token)
            return '';
        try {
            const payload = JSON.parse(atob(token.split('.')[1] || ''));
            return payload.name || payload.email || '';
        }
        catch {
            return '';
        }
    }
    function handleDownloadPdf() {
        if (!employee || !rows.length)
            return;
        const doc = new jsPDF('p', 'pt', 'a4');
        const monthLabel = month || todayMonthIso();
        const title = 'Monthly Attendance Detail';
        const employeeLine = `Employee: ${employee.employeeName || ''}`;
        const emiratesLine = `Emirates ID: ${employee.emiratesId || ''}`;
        const monthLine = `Month: ${monthLabel}`;
        doc.setFontSize(14);
        doc.text(title, 40, 40);
        doc.setFontSize(10);
        doc.text(employeeLine, 40, 60);
        doc.text(emiratesLine, 40, 76);
        doc.text(monthLine, 40, 92);
        const head = [[
                'Date',
                'Status',
                'Check-In',
                'Check-Out',
                'OT (HRS)',
                'Site / Project',
                'Approved By',
                'Signature',
            ]];
        const body = rows.map((r) => [
            new Date(r.date).toLocaleDateString(),
            r.status || '',
            r.checkIn || '',
            r.checkOut || '',
            r.otHours || '0',
            r.site || '',
            r.approvedBy || '',
            r.signature || '',
        ]);
        autoTable(doc, {
            head,
            body,
            startY: 110,
            styles: {
                fontSize: 8,
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
            },
            headStyles: {
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
            },
            alternateRowStyles: {
                fillColor: [255, 255, 255],
            },
        });
        const safeName = (employee.employeeName || 'employee').replace(/[^a-z0-9]+/gi, '-');
        const fileName = `attendance-${safeName}-${monthLabel}.pdf`;
        doc.save(fileName);
    }
    // Load projects once (same source as AttendanceEntry)
    React.useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            try {
                const projRes = await fetchProjects({ page: 1, pageSize: 200, token });
                setProjects(projRes.data || []);
            }
            catch {
                setProjects([]);
            }
        })();
    }, []);
    const loadMonth = React.useCallback(async () => {
        const token = localStorage.getItem('token') || undefined;
        if (!employeeId)
            return;
        try {
            setLoading(true);
            setErrorMessage('');
            // 1) Load employee so we know Emirates ID and name
            const empRes = await fetchEmployees({ page: 1, pageSize: 500, token });
            const all = empRes.data || [];
            const emp = all.find((e) => e.id === employeeId) || null;
            setEmployee(emp || null);
            // 2) Compute month start / end (as calendar month boundaries)
            const [yStr, mStr] = month.split('-');
            const y = Number(yStr);
            const mIndex = Number(mStr || '1') - 1;
            const endDate = new Date(y, mIndex + 1, 0);
            const startStr = `${month}-01`;
            const endStr = `${month}-${String(endDate.getDate()).padStart(2, '0')}`;
            // 3) Fetch attendance for this date range, filtered by this employeeId.
            // We still apply an emiratesId safety check in-memory, but the primary
            // filter is now the stable employeeId, so any records created from the
            // Attendance Entry page for this employee/date are always included.
            const attRes = await fetchAttendance({
                page: 1,
                pageSize: 2000,
                start: startStr,
                end: endStr,
                employeeId,
                token,
            });
            const att = attRes.data || [];
            // Index by date
            const byDate = new Map();
            const targetEmiratesId = emp?.emiratesId;
            for (const a of att) {
                // Safety: double-check by emiratesId if it is present, to avoid any
                // edge-case mixing. The primary filter is employeeId, so this should
                // normally always match.
                const recEmiratesId = a.emiratesId ?? a.employee?.emiratesId;
                if (targetEmiratesId && recEmiratesId && String(recEmiratesId) !== String(targetEmiratesId)) {
                    continue;
                }
                const rawDate = a.date ?? a.check_in ?? a.checkIn;
                const dStr = typeof rawDate === 'string'
                    ? rawDate.slice(0, 10)
                    : dateOnlyLocal(rawDate);
                // Enforce that we only index records that belong to the currently selected month
                if (dStr.slice(0, 7) !== month)
                    continue;
                if (dStr < startStr || dStr > endStr)
                    continue;
                byDate.set(dStr, a);
            }
            const days = [];
            for (let d = 1; d <= endDate.getDate(); d++) {
                const dateStr = `${month}-${String(d).padStart(2, '0')}`;
                const a = byDate.get(dateStr);
                if (a) {
                    const statusRaw = String(a.status || '').toUpperCase();
                    const status = statusRaw === 'P' || statusRaw === 'PRESENT' ? 'P'
                        : statusRaw === 'A' || statusRaw === 'ABSENT' ? 'A'
                            : statusRaw === 'HOLIDAY' ? 'HOLIDAY'
                                : statusRaw === 'HALF DAY' || statusRaw === 'HALF-DAY' ? 'HALF DAY'
                                    : '';
                    const checkInRaw = a.checkIn ?? a.check_in;
                    const checkOutRaw = a.checkOut ?? a.check_out;
                    days.push({
                        date: dateStr,
                        attendanceId: a.id,
                        status,
                        checkIn: extractLocalTime(checkInRaw),
                        checkOut: extractLocalTime(checkOutRaw),
                        otHours: a.otHours != null ? String(a.otHours) : '0',
                        mainContractor: '',
                        projectId: '',
                        site: a.location || '',
                        approvedBy: a.approvedBy || '',
                        signature: a.signature || '',
                    });
                }
                else {
                    // No record in DB yet for this date – leave as "Select" until user sets a status.
                    days.push({
                        date: dateStr,
                        attendanceId: undefined,
                        status: '',
                        checkIn: '',
                        checkOut: '',
                        otHours: '0',
                        mainContractor: '',
                        projectId: '',
                        site: '',
                        approvedBy: '',
                        signature: '',
                    });
                }
            }
            setRows(days);
        }
        catch (e) {
            setErrorMessage('Failed to load attendance');
            setRows([]);
        }
        finally {
            setLoading(false);
        }
    }, [employeeId, month]);
    React.useEffect(() => {
        loadMonth();
    }, [loadMonth]);
    function isRowComplete(row) {
        const s = String(row.status || '').toUpperCase();
        if (s === 'A' || s === 'HOLIDAY') {
            return !!row.status; // Only status required for A / HOLIDAY
        }
        if (!row.status)
            return false;
        return !!row.checkIn && !!row.checkOut && !!row.site;
    }
    async function handleSaveRow(r) {
        if (!employeeId)
            return;
        if (!window.confirm('Are you sure you want to save the latest changes for this date?')) {
            return;
        }
        // Apply AttendanceEntry-style validation rules
        setShowValidationErrors(true);
        setErrorMessage('');
        setInfoMessage('');
        if (!isRowComplete(r)) {
            // Missing required fields – keep highlights on and use the same message as API failure
            setErrorMessage('Failed to save. Please check required fields.');
            return;
        }
        const token = localStorage.getItem('token') || undefined;
        setSaving(true);
        try {
            const sUpper = String(r.status || '').toUpperCase();
            const date = r.date;
            const checkInIso = sUpper === 'A' || sUpper === 'HOLIDAY'
                ? `${date}T00:00:00`
                : `${date}T${r.checkIn}:00`;
            const approverName = getCurrentUserName();
            const body = {
                status: r.status,
                check_in: checkInIso,
                lastEditedAt: new Date().toISOString(),
            };
            if (!(sUpper === 'A' || sUpper === 'HOLIDAY')) {
                if (r.checkOut)
                    body.check_out = `${date}T${r.checkOut}:00`;
                if (r.site)
                    body.location = r.site;
            }
            if (approverName) {
                body.approvedBy = approverName;
            }
            // Optional fields: OT and Signature
            if (r.otHours !== undefined) {
                const parsed = Number(r.otHours || '0');
                if (!Number.isNaN(parsed))
                    body.otHours = parsed;
            }
            if (r.signature) {
                body.signature = r.signature;
            }
            else {
                body.signature = null;
            }
            if (r.attendanceId) {
                await updateAttendance({ id: r.attendanceId, token }, body);
            }
            else {
                await createAttendance({
                    employeeId,
                    ...body,
                    token,
                });
            }
            // Reload current month from backend so table matches DB exactly
            await loadMonth();
            setErrorMessage('');
            setInfoMessage('Saved successfully.');
        }
        catch (e) {
            // Keep validation highlights visible so missing fields are clearly shown
            setShowValidationErrors(true);
            setErrorMessage('Failed to save. Please check required fields.');
        }
        finally {
            setSaving(false);
        }
    }
    async function handleDeleteRow(r) {
        if (!r.attendanceId)
            return;
        if (!window.confirm('Are you sure you want to delete this attendance record?'))
            return;
        const token = localStorage.getItem('token') || undefined;
        setSaving(true);
        try {
            await deleteAttendance({ id: r.attendanceId, token });
            // Reload current month so this date becomes an empty row
            await loadMonth();
        }
        catch (e) {
            setErrorMessage('Failed to delete attendance');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "lg:hidden space-y-1", children: [_jsx("div", { className: "text-base font-semibold", children: "Attendance Monthly" }), _jsx("div", { className: "text-xs uppercase tracking-wide text-[color:var(--text-secondary)]", children: "HR / Attendance" })] }), _jsxs("div", { className: "hidden lg:block", children: [_jsx("div", { className: "text-lg font-semibold", children: "HR / Attendance / Employee Monthly" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > HR > Attendance > Employee Monthly" })] }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2 w-full sm:w-auto justify-center", onClick: () => navigate('/hr/attendance/records'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(CardTitle, { children: "Monthly Attendance Detail" }), employee && (_jsxs("div", { className: "text-xs sm:text-sm zynq-muted space-y-0.5", children: [_jsxs("div", { children: ["Employee: ", _jsx("span", { className: "font-medium", children: employee.employeeName })] }), _jsxs("div", { children: ["Emirates ID: ", _jsx("span", { className: "font-mono", children: employee.emiratesId })] })] }))] }), _jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end", children: [_jsx("div", { className: "w-full sm:w-40", children: _jsx(Input, { label: "Month", type: "month", value: month, onChange: (e) => setMonth(e.target.value) }) }), _jsx(Button, { size: "sm", variant: "secondary", onClick: handleDownloadPdf, disabled: !rows.length, className: "w-full sm:w-auto", children: "Download PDF" })] })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "-mx-4 px-4 sm:mx-0 sm:px-0", children: _jsx("div", { className: "flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 text-xs sm:text-sm sm:grid sm:grid-cols-5 sm:gap-3 sm:overflow-visible sm:snap-none", children: [{
                                                        label: 'Total Present', value: monthlyTotals.totalPresent,
                                                    }, {
                                                        label: 'Total Absent', value: monthlyTotals.totalAbsent,
                                                    }, {
                                                        label: 'Total Holiday', value: monthlyTotals.totalHoliday,
                                                    }, {
                                                        label: 'Total Half Day', value: monthlyTotals.totalHalfDay,
                                                    }, {
                                                        label: 'Total OT (hrs)', value: monthlyTotals.totalOt.toFixed(1),
                                                    }].map((item) => (_jsxs("div", { className: "min-w-[150px] flex-shrink-0 snap-start rounded-lg border zynq-border bg-[color:var(--surface)] px-3 py-2", children: [_jsx("div", { className: "zynq-muted text-[11px] uppercase tracking-wide", children: item.label }), _jsx("div", { className: "text-base font-semibold", children: item.value })] }, item.label))) }) }), errorMessage && (_jsx("div", { className: "mb-2 text-xs sm:text-sm text-rose-500 font-medium", children: errorMessage })), !errorMessage && infoMessage && (_jsx("div", { className: "mb-2 text-xs sm:text-sm text-emerald-500 font-medium", children: infoMessage })), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(IonSpinner, { name: "dots" }) })) : (_jsx("div", { className: "overflow-auto rounded-xl border zynq-border bg-[color:var(--surface)] text-xs sm:text-sm shadow-[var(--shadow)]", children: _jsxs("table", { className: "min-w-[720px]", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b zynq-border bg-[color:var(--muted)]/10", children: [_jsx("th", { className: "px-3 py-2 text-left", children: "DATE" }), _jsx("th", { className: "px-3 py-2 text-left", children: "STATUS" }), _jsx("th", { className: "px-3 py-2 text-left", children: "CHECK-IN" }), _jsx("th", { className: "px-3 py-2 text-left", children: "CHECK-OUT" }), _jsx("th", { className: "px-3 py-2 text-left", children: "OT (HRS)" }), _jsx("th", { className: "px-3 py-2 text-left", children: "SITE / PROJECT" }), _jsx("th", { className: "px-3 py-2 text-left", children: "APPROVED BY" }), _jsx("th", { className: "px-3 py-2 text-left", children: "SIGNATURE" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Actions" })] }) }), _jsx("tbody", { children: rows.map((row) => {
                                                            const statusUpper = String(row.status || '').toUpperCase();
                                                            const isAbsentLike = statusUpper === 'A' || statusUpper === 'HOLIDAY';
                                                            return (_jsxs("tr", { className: "border-b zynq-border last:border-0", children: [_jsx("td", { className: "px-3 py-2 align-top", children: new Date(row.date).toLocaleDateString() }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsxs(Select, { value: row.status, className: showValidationErrors && !row.status
                                                                                ? 'border-rose-500 focus:ring-rose-500'
                                                                                : undefined, onChange: (e) => {
                                                                                const value = e.target.value;
                                                                                setRows((prev) => prev.map((r) => (r.date === row.date ? { ...r, status: value } : r)));
                                                                            }, disabled: isTeamLeader, children: [_jsx("option", { value: "", children: "Select" }), _jsx("option", { value: "P", children: "P" }), _jsx("option", { value: "A", children: "A" }), _jsx("option", { value: "HALF DAY", children: "HALF DAY" }), _jsx("option", { value: "HOLIDAY", children: "HOLIDAY" })] }) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx("input", { type: "time", className: `zynq-input w-full${showValidationErrors && !row.checkIn && !isAbsentLike && row.status && row.status !== 'A' && row.status !== 'HOLIDAY'
                                                                                ? ' border-rose-500 focus:ring-rose-500'
                                                                                : ''}`, value: row.checkIn, onChange: (e) => {
                                                                                const value = e.target.value;
                                                                                setRows((prev) => prev.map((r) => (r.date === row.date ? { ...r, checkIn: value } : r)));
                                                                            }, disabled: isAbsentLike || isTeamLeader }) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx("input", { type: "time", className: `zynq-input w-full${showValidationErrors && !row.checkOut && !isAbsentLike && row.status && row.status !== 'A' && row.status !== 'HOLIDAY'
                                                                                ? ' border-rose-500 focus:ring-rose-500'
                                                                                : ''}`, value: row.checkOut, onChange: (e) => {
                                                                                const value = e.target.value;
                                                                                setRows((prev) => prev.map((r) => (r.date === row.date ? { ...r, checkOut: value } : r)));
                                                                            }, disabled: isAbsentLike || isTeamLeader }) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx(Select, { value: row.otHours, onChange: (e) => {
                                                                                const value = e.target.value;
                                                                                setRows((prev) => prev.map((r) => (r.date === row.date ? { ...r, otHours: value } : r)));
                                                                            }, disabled: isAbsentLike || isTeamLeader, children: otOptions.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) }) }), _jsx("td", { className: "px-3 py-2 align-top", children: editingSiteDate === row.date ? (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs(Select, { value: row.mainContractor, className: showValidationErrors &&
                                                                                        !row.mainContractor &&
                                                                                        !isAbsentLike &&
                                                                                        row.status &&
                                                                                        row.status !== 'A' &&
                                                                                        row.status !== 'HOLIDAY'
                                                                                        ? 'border-rose-500 focus:ring-rose-500'
                                                                                        : undefined, onChange: (e) => {
                                                                                        const value = e.target.value;
                                                                                        setRows((prev) => prev.map((r) => r.date === row.date
                                                                                            ? {
                                                                                                ...r,
                                                                                                mainContractor: value,
                                                                                                projectId: '',
                                                                                                site: '',
                                                                                            }
                                                                                            : r));
                                                                                    }, disabled: isAbsentLike || isTeamLeader, children: [_jsx("option", { value: "", children: "Main-Contractor" }), mainContractorOptions.map((c) => (_jsx("option", { value: c, children: c }, c)))] }), _jsxs(Select, { value: row.projectId, className: showValidationErrors &&
                                                                                        !row.projectId &&
                                                                                        !isAbsentLike &&
                                                                                        row.status &&
                                                                                        row.status !== 'A' &&
                                                                                        row.status !== 'HOLIDAY'
                                                                                        ? 'border-rose-500 focus:ring-rose-500'
                                                                                        : undefined, onChange: (e) => {
                                                                                        const value = e.target.value;
                                                                                        const sites = siteOptionsFor(row.mainContractor, value);
                                                                                        setRows((prev) => prev.map((r) => r.date === row.date
                                                                                            ? {
                                                                                                ...r,
                                                                                                projectId: value,
                                                                                                site: sites[0] || '',
                                                                                            }
                                                                                            : r));
                                                                                    }, disabled: !row.mainContractor || isAbsentLike || isTeamLeader, children: [_jsx("option", { value: "", children: "Project" }), projectOptionsFor(row.mainContractor).map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id)))] }), _jsxs(Select, { value: row.site, className: showValidationErrors &&
                                                                                        !row.site &&
                                                                                        !isAbsentLike &&
                                                                                        row.status &&
                                                                                        row.status !== 'A' &&
                                                                                        row.status !== 'HOLIDAY'
                                                                                        ? 'border-rose-500 focus:ring-rose-500'
                                                                                        : undefined, onChange: (e) => {
                                                                                        const value = e.target.value;
                                                                                        setRows((prev) => prev.map((r) => (r.date === row.date ? { ...r, site: value } : r)));
                                                                                    }, disabled: !row.projectId || isAbsentLike || isTeamLeader, children: [_jsx("option", { value: "", children: "Site" }), siteOptionsFor(row.mainContractor, row.projectId).map((s) => (_jsx("option", { value: s, children: s }, s)))] }), _jsx("div", { className: "flex justify-end pt-1", children: _jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditingSiteDate(null), disabled: isTeamLeader, children: "Done" }) })] })) : (_jsxs("button", { type: "button", className: `w-full text-left text-xs sm:text-sm${showValidationErrors &&
                                                                                !row.site &&
                                                                                !isAbsentLike &&
                                                                                row.status &&
                                                                                row.status !== 'A' &&
                                                                                row.status !== 'HOLIDAY'
                                                                                ? ' border border-rose-500 rounded-md'
                                                                                : ''}`, onClick: () => {
                                                                                if (isAbsentLike)
                                                                                    return;
                                                                                if (!isTeamLeader)
                                                                                    setEditingSiteDate(row.date);
                                                                            }, children: [_jsx("div", { className: "font-medium", children: row.site || 'Select site' }), (row.mainContractor || row.projectId) && (_jsx("div", { className: "zynq-muted text-[11px] leading-tight", children: row.mainContractor || '—' }))] })) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx("div", { className: "text-xs sm:text-[13px] text-[color:var(--muted-foreground)]", children: row.approvedBy || '\u2014' }) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx("input", { className: "zynq-input w-full", value: row.signature, onChange: (e) => {
                                                                                const value = e.target.value;
                                                                                setRows((prev) => prev.map((r) => (r.date === row.date ? { ...r, signature: value } : r)));
                                                                            }, placeholder: "Signature (optional)", disabled: isAbsentLike }) }), _jsx("td", { className: "px-3 py-2 align-top", children: !isTeamLeader && (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => handleSaveRow(row), disabled: saving, children: "Save" }), row.attendanceId && (_jsx(Button, { size: "sm", variant: "subtle", className: "text-rose-500 hover:text-rose-600 hover:bg-rose-500/5", onClick: () => handleDeleteRow(row), disabled: saving, children: "Delete" }))] })) })] }, row.date));
                                                        }) })] }) }))] })] })] }) })] }));
}

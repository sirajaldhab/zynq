import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Select from '../../ui/Select';
import { useAuth } from '../../auth/AuthContext';
import { fetchEmployees, fetchAttendance, createAttendance } from '../../api/hrService';
import { fetchProjects } from '../../api/projectsService';
import { chevronBackOutline } from 'ionicons/icons';
function todayIso() {
    return new Date().toISOString().slice(0, 10);
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
const STORAGE_KEY_ROWS = 'hr_attendance_entry_rows_v1';
const STORAGE_KEY_SUBMITTED = 'hr_attendance_entry_submitted_dates_v1';
export default function HRAttendanceEntry() {
    const navigate = useNavigate();
    const { accessToken } = useAuth();
    const [employees, setEmployees] = React.useState([]);
    const [projects, setProjects] = React.useState([]);
    const [rows, setRows] = React.useState([]);
    const [selectedDate, setSelectedDate] = React.useState(todayIso);
    const [bulkCheckIn, setBulkCheckIn] = React.useState('');
    const [bulkCheckOut, setBulkCheckOut] = React.useState('');
    const [editingSiteRowId, setEditingSiteRowId] = React.useState(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [infoMessage, setInfoMessage] = React.useState('');
    const [hideTable, setHideTable] = React.useState(false);
    const [showValidationErrors, setShowValidationErrors] = React.useState(false);
    const [pendingDates, setPendingDates] = React.useState([]);
    const [submittedDates, setSubmittedDates] = React.useState([]);
    const otOptions = React.useMemo(() => ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8'], []);
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
    function projectNameById(id) {
        if (!id)
            return '';
        const p = projects.find((x) => x.id === id);
        return p?.name || '';
    }
    const approvedBy = React.useMemo(() => {
        let name = 'User';
        try {
            const payload = accessToken ? JSON.parse(atob(accessToken.split('.')[1] || '')) : {};
            name = payload.name || payload.username || payload.email || name;
        }
        catch { }
        return name;
    }, [accessToken]);
    function buildRowsForDate(date) {
        return employees
            .filter((e) => String(e.status || '').toUpperCase() === 'ACTIVE')
            .map((e, idx) => ({
            id: e.id || `row-${idx + 1}`,
            date,
            employeeId: e.id,
            employeeName: e.employeeName || '',
            emiratesId: e.emiratesId || '',
            checkIn: '',
            checkOut: '',
            status: '',
            otHours: '0',
            mainContractor: '',
            projectId: '',
            site: '',
            approvedBy,
            signature: '',
        }));
    }
    React.useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            try {
                const [empRes, projRes] = await Promise.all([
                    fetchEmployees({ page: 1, pageSize: 200, token }),
                    fetchProjects({ page: 1, pageSize: 200, token }),
                ]);
                setEmployees(empRes.data || []);
                setProjects(projRes.data || []);
            }
            catch {
                setEmployees([]);
                setProjects([]);
            }
        })();
    }, []);
    React.useEffect(() => {
        if (!employees.length)
            return;
        const today = todayIso();
        const activeDate = selectedDate || today;
        setRows((prev) => {
            // If we already have rows for the currently selected date, keep them
            if (prev.length > 0 && prev[0]?.date === activeDate)
                return prev;
            // Try to restore from localStorage, but ONLY if the stored rows belong to
            // this same activeDate. This avoids the bug where rows from a different
            // date (e.g. 22/11) are reused when the user navigates to 10/10, causing
            // submissions to be saved under the wrong day.
            try {
                const raw = localStorage.getItem(STORAGE_KEY_ROWS);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.date === activeDate) {
                        return parsed;
                    }
                }
            }
            catch { }
            // Default: build rows for selected date (or today) for all active employees
            return buildRowsForDate(activeDate);
        });
        // Load submitted dates for the current month from backend attendance records
        (async () => {
            try {
                const token = localStorage.getItem('token') || undefined;
                // Compute month start / end for the month of "today"
                const [yStr, mStr, dStr] = today.split('-');
                const y = Number(yStr);
                const mIndex = Number(mStr || '1') - 1;
                const endDate = new Date(y, mIndex + 1, 0);
                const startStr = `${yStr}-${mStr}-01`;
                const endStr = `${yStr}-${mStr}-${String(endDate.getDate()).padStart(2, '0')}`;
                const attRes = await fetchAttendance({
                    page: 1,
                    pageSize: 2000,
                    start: startStr,
                    end: endStr,
                    token,
                });
                const att = attRes.data || [];
                // Build a set of ACTIVE employee IDs for completeness checks
                const activeEmployeeIds = new Set(employees
                    .filter((e) => String(e.status || '').toUpperCase() === 'ACTIVE')
                    .map((e) => e.id)
                    .filter(Boolean));
                // Group attendance records by date -> set of employeeIds that have any record
                const dateToEmployeeIds = new Map();
                for (const a of att) {
                    const rawDate = a.date ?? a.check_in ?? a.checkIn;
                    if (!rawDate)
                        continue;
                    const dStr2 = typeof rawDate === 'string'
                        ? rawDate.slice(0, 10)
                        : dateOnlyLocal(rawDate);
                    // Only consider records belonging to the same year-month as today
                    if (dStr2.slice(0, 7) !== `${yStr}-${mStr}`)
                        continue;
                    const empId = String(a.employeeId || a.employee_id || '').trim();
                    if (!empId)
                        continue;
                    if (!dateToEmployeeIds.has(dStr2)) {
                        dateToEmployeeIds.set(dStr2, new Set());
                    }
                    dateToEmployeeIds.get(dStr2).add(empId);
                }
                // A date is considered submitted only if ALL active employees
                // have at least one attendance record on that date.
                const submittedSet = new Set();
                dateToEmployeeIds.forEach((empSet, dateStr) => {
                    // If there are no active employees, treat nothing as submitted
                    if (!activeEmployeeIds.size)
                        return;
                    let allHaveRecords = true;
                    for (const id of activeEmployeeIds) {
                        if (!empSet.has(id)) {
                            allHaveRecords = false;
                            break;
                        }
                    }
                    if (allHaveRecords)
                        submittedSet.add(dateStr);
                });
                // Merge with locally remembered submitted dates so that any date the
                // user has successfully submitted in this browser session remains
                // marked as submitted, even if the server listing misses it.
                try {
                    const stored = localStorage.getItem(STORAGE_KEY_SUBMITTED);
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                            for (const d of parsed)
                                submittedSet.add(d);
                        }
                    }
                }
                catch { }
                const submitted = Array.from(submittedSet);
                setSubmittedDates(submitted);
                // Selected date status message
                if (submittedSet.has(activeDate)) {
                    setHideTable(true);
                    setInfoMessage(`Attendance submitted for ${activeDate}`);
                }
                else {
                    setHideTable(false);
                    setInfoMessage(`Pending attendance entry for ${activeDate}`);
                }
                // Compute pending (missing) dates for current month up to and including today
                try {
                    const currentDay = Number(dStr || '1');
                    const pending = [];
                    for (let d = 1; d <= currentDay; d++) {
                        const dateStr = `${yStr}-${mStr}-${String(d).padStart(2, '0')}`;
                        if (!submittedSet.has(dateStr)) {
                            pending.push(dateStr);
                        }
                    }
                    setPendingDates(pending);
                }
                catch {
                    setPendingDates([]);
                }
            }
            catch {
                setHideTable(false);
                setInfoMessage('Pending Attendance Entry');
                setPendingDates([]);
                setSubmittedDates([]);
            }
        })();
    }, [employees, approvedBy, selectedDate]);
    // Persist rows locally until Clear or Submit
    React.useEffect(() => {
        try {
            if (rows.length > 0) {
                localStorage.setItem(STORAGE_KEY_ROWS, JSON.stringify(rows));
            }
        }
        catch { }
    }, [rows]);
    function updateRow(id, patch) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    }
    function applyCheckInAll() {
        if (!bulkCheckIn)
            return;
        setRows((prev) => prev.map((r) => ({ ...r, checkIn: bulkCheckIn })));
    }
    function applyCheckOutAll() {
        if (!bulkCheckOut)
            return;
        setRows((prev) => prev.map((r) => ({ ...r, checkOut: bulkCheckOut })));
    }
    function addRow() {
        const idx = rows.length + 1;
        setRows((prev) => [
            ...prev,
            {
                id: `row-${idx}`,
                date: todayIso(),
                employeeId: '',
                employeeName: '',
                emiratesId: '',
                checkIn: '',
                checkOut: '',
                status: '',
                otHours: '',
                mainContractor: '',
                projectId: '',
                site: '',
                approvedBy,
                signature: '',
            },
        ]);
    }
    function clearAll() {
        setErrorMessage('');
        setInfoMessage('Pending Attendance Entry');
        setShowValidationErrors(false);
        try {
            localStorage.removeItem(STORAGE_KEY_ROWS);
        }
        catch { }
        const today = todayIso();
        const activeDate = selectedDate || today;
        setRows(buildRowsForDate(activeDate));
        setHideTable(false);
    }
    function openPendingDate(date) {
        setErrorMessage('');
        setInfoMessage('Pending Attendance Entry');
        setShowValidationErrors(false);
        try {
            localStorage.removeItem(STORAGE_KEY_ROWS);
        }
        catch { }
        setSelectedDate(() => date);
        setRows(buildRowsForDate(date));
        setHideTable(false);
    }
    function isRowComplete(row) {
        const s = String(row.status || '').toUpperCase();
        // For Absent or Holiday, only basic identity + status are required
        if (s === 'A' || s === 'HOLIDAY') {
            return !!row.employeeId && !!row.status;
        }
        // For Present / Half Day, all mandatory fields must be filled
        return (!!row.date &&
            !!row.employeeId &&
            !!row.employeeName &&
            !!row.emiratesId &&
            !!row.checkIn &&
            !!row.checkOut &&
            !!row.status &&
            !!row.mainContractor &&
            !!row.projectId &&
            !!row.site &&
            !!row.approvedBy);
    }
    async function submitAll() {
        setErrorMessage('');
        setInfoMessage('');
        setShowValidationErrors(true);
        if (!rows.length)
            return;
        // Validate mandatory fields (all except OT and Signature)
        const hasMissing = rows.some((r) => !isRowComplete(r));
        if (hasMissing) {
            setErrorMessage('Complete Attendance Entry');
            return;
        }
        const token = localStorage.getItem('token') || undefined;
        setSubmitting(true);
        try {
            for (const r of rows) {
                const date = r.date || todayIso();
                const s = String(r.status || '').toUpperCase();
                // Always send a valid check_in so backend can create/update the record.
                // For Absent/Holiday, use the day at 00:00; for others, use the entered check-in time.
                const checkInIso = s === 'A' || s === 'HOLIDAY'
                    ? `${date}T00:00:00`
                    : `${date}T${r.checkIn}:00`;
                const base = {
                    employeeId: r.employeeId,
                    emiratesId: r.emiratesId,
                    status: r.status,
                    check_in: checkInIso,
                };
                if (!(s === 'A' || s === 'HOLIDAY')) {
                    const checkOutIso = r.checkOut ? `${date}T${r.checkOut}:00` : undefined;
                    if (checkOutIso)
                        base.check_out = checkOutIso;
                    if (r.site)
                        base.location = r.site;
                }
                // Optional field: OT (always parsed, including 0)
                if (r.otHours !== undefined) {
                    const parsed = Number(r.otHours || '0');
                    if (!Number.isNaN(parsed))
                        base.otHours = parsed;
                }
                if (r.signature) {
                    base.signature = r.signature;
                }
                await createAttendance({
                    ...base,
                    token,
                });
            }
            // Mark selected date as submitted in-memory and recompute pending dates
            const today = todayIso();
            const date = rows[0]?.date || selectedDate || today;
            const todayParts = today.split('-');
            const [yStr, mStr, dStr] = todayParts;
            const currentDay = Number(dStr || '1');
            setSubmittedDates((prev) => {
                const set = new Set(prev);
                set.add(date);
                const nextSubmitted = Array.from(set);
                // Persist submitted dates locally so future refreshes remember them
                try {
                    localStorage.setItem(STORAGE_KEY_SUBMITTED, JSON.stringify(nextSubmitted));
                }
                catch { }
                const pending = [];
                for (let d = 1; d < currentDay; d++) {
                    const dateStr = `${yStr}-${mStr}-${String(d).padStart(2, '0')}`;
                    if (!set.has(dateStr)) {
                        pending.push(dateStr);
                    }
                }
                setPendingDates(pending);
                return nextSubmitted;
            });
            // Clear local rows and show success message for this date
            try {
                localStorage.removeItem(STORAGE_KEY_ROWS);
            }
            catch { }
            setHideTable(true);
            setInfoMessage('Selected date attendance submitted');
            setShowValidationErrors(false);
        }
        catch (err) {
            setErrorMessage('Failed to submit attendance');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "lg:hidden space-y-1", children: [_jsx("div", { className: "text-base font-semibold", children: "Attendance Entry" }), _jsx("div", { className: "text-xs uppercase tracking-wide text-[color:var(--text-secondary)]", children: "HR / Attendance" })] }), _jsxs("div", { className: "hidden lg:block", children: [_jsx("div", { className: "text-lg font-semibold", children: "HR / Attendance Entry" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > HR > Attendance > Entry" })] }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2 w-full sm:w-auto justify-center", onClick: () => navigate('/hr/attendance'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx(CardTitle, { children: "Attendance Entry" }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs sm:text-sm", children: [_jsx("span", { className: "zynq-muted", children: "Select Date" }), _jsx("input", { type: "date", className: `zynq-input text-xs sm:text-sm w-40$${''}`.replace('$$', ''), max: todayIso(), value: selectedDate, onChange: (e) => {
                                                                const value = e.target.value;
                                                                if (!value)
                                                                    return;
                                                                // Prevent selecting future dates
                                                                if (value > todayIso())
                                                                    return;
                                                                setSelectedDate(value);
                                                                setRows([]);
                                                            } }), pendingDates.includes(selectedDate) && (_jsx("span", { className: "text-rose-500 text-xs font-medium", children: "Pending" })), !pendingDates.includes(selectedDate) && submittedDates.includes(selectedDate) && (_jsx("span", { className: "text-emerald-500 text-xs font-medium", children: "Submitted" }))] })] }), _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center", children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: clearAll, className: "w-full sm:w-auto", children: "Clear" }), _jsx(Button, { size: "sm", onClick: submitAll, disabled: submitting, className: "w-full sm:w-auto", children: submitting ? 'Submitting...' : 'Submit' })] })] }), _jsxs(CardContent, { children: [pendingDates.length > 0 && (_jsxs("div", { className: "mb-3 text-xs sm:text-sm", children: [_jsx("div", { className: "mb-1 zynq-muted", children: "Pending days (not submitted):" }), _jsx("div", { className: "flex flex-wrap gap-2", children: pendingDates.map((d) => (_jsx("button", { type: "button", onClick: () => openPendingDate(d), className: "px-2 py-1 rounded border border-rose-400/60 text-rose-500 text-xs bg-rose-500/5 hover:bg-rose-500/10", children: new Date(d).toLocaleDateString() }, d))) })] })), infoMessage && (_jsx("div", { className: "mb-2 text-xs sm:text-sm text-emerald-500 font-medium", children: infoMessage })), errorMessage && (_jsx("div", { className: "mb-2 text-xs sm:text-sm text-rose-500 font-medium", children: errorMessage })), !hideTable && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-3 flex flex-col gap-3 text-xs sm:text-sm", children: [_jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3", children: [_jsx("span", { className: "zynq-muted text-xs sm:text-sm", children: "Set Check-In for all" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "time", className: "zynq-input", value: bulkCheckIn, onChange: (e) => setBulkCheckIn(e.target.value) }), _jsx(Button, { size: "sm", variant: "secondary", onClick: applyCheckInAll, children: "Apply" })] })] }), _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3", children: [_jsx("span", { className: "zynq-muted text-xs sm:text-sm", children: "Set Check-Out for all" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "time", className: "zynq-input", value: bulkCheckOut, onChange: (e) => setBulkCheckOut(e.target.value) }), _jsx(Button, { size: "sm", variant: "secondary", onClick: applyCheckOutAll, children: "Apply" })] })] })] }), _jsx("div", { className: "overflow-auto rounded-xl border zynq-border bg-[color:var(--surface)] text-xs sm:text-sm shadow-[var(--shadow)]", children: _jsxs("table", { className: "min-w-[960px]", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b zynq-border bg-[color:var(--muted)]/10", children: [_jsx("th", { className: "px-3 py-2 text-left", children: "DATE" }), _jsx("th", { className: "px-3 py-2 text-left", children: "EMPLOYEE NAME" }), _jsx("th", { className: "px-3 py-2 text-left", children: "EMIRATES ID" }), _jsx("th", { className: "px-3 py-2 text-left", children: "CHECK-IN" }), _jsx("th", { className: "px-3 py-2 text-left", children: "CHECK-OUT" }), _jsx("th", { className: "px-3 py-2 text-left", children: "STATUS" }), _jsxs("th", { className: "px-3 py-2 text-left", children: [_jsx("div", { className: "font-semibold", children: "OT (HRS)" }), _jsx("div", { className: "zynq-muted text-[10px] leading-tight", children: "Overtime" })] }), _jsx("th", { className: "px-3 py-2 text-left", children: "SITE / PROJECT" }), _jsx("th", { className: "px-3 py-2 text-left", children: "APPROVED BY" }), _jsx("th", { className: "px-3 py-2 text-left", children: "SIGNATURE" })] }) }), _jsx("tbody", { children: rows.map((row) => {
                                                                    const statusUpper = String(row.status || '').toUpperCase();
                                                                    const isAbsentLike = statusUpper === 'A' || statusUpper === 'HOLIDAY';
                                                                    const showTimeInputs = statusUpper === 'P' || statusUpper === 'HALF DAY';
                                                                    const statusCls = row.status === 'P'
                                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                                        : row.status === 'A'
                                                                            ? 'bg-rose-500/10 text-rose-500'
                                                                            : 'bg-slate-500/10 text-slate-400';
                                                                    return (_jsxs("tr", { className: "border-b zynq-border last:border-0", children: [_jsx("td", { className: "px-3 py-2 align-top", children: _jsx("input", { type: "date", className: "zynq-input w-full", value: row.date, readOnly: true, disabled: true }) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx("div", { className: "text-sm", children: row.employeeName }) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx("input", { className: "zynq-input w-full", value: row.emiratesId, readOnly: true, disabled: true }) }), _jsx("td", { className: "px-3 py-2 align-top", children: showTimeInputs ? (_jsx("input", { type: "time", className: `zynq-input w-full${showValidationErrors && !row.checkIn && !isAbsentLike
                                                                                        ? ' border-rose-500 focus:ring-rose-500'
                                                                                        : ''}`, value: row.checkIn, onChange: (e) => updateRow(row.id, { checkIn: e.target.value }) })) : null }), _jsx("td", { className: "px-3 py-2 align-top", children: showTimeInputs ? (_jsx("input", { type: "time", className: `zynq-input w-full${showValidationErrors && !row.checkOut && !isAbsentLike
                                                                                        ? ' border-rose-500 focus:ring-rose-500'
                                                                                        : ''}`, value: row.checkOut, onChange: (e) => updateRow(row.id, { checkOut: e.target.value }) })) : null }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Select, { value: row.status, className: showValidationErrors && !row.status
                                                                                                ? 'border-rose-500 focus:ring-rose-500'
                                                                                                : undefined, onChange: (e) => {
                                                                                                const value = e.target.value;
                                                                                                if (value === 'P') {
                                                                                                    // Auto-fill default times for Present, keeping them editable
                                                                                                    const nextCheckIn = row.checkIn || '06:00';
                                                                                                    const nextCheckOut = row.checkOut || '16:00';
                                                                                                    updateRow(row.id, {
                                                                                                        status: value,
                                                                                                        checkIn: nextCheckIn,
                                                                                                        checkOut: nextCheckOut,
                                                                                                    });
                                                                                                }
                                                                                                else if (value === 'HALF DAY') {
                                                                                                    // Half Day: keep time fields blank, user must enter manually
                                                                                                    updateRow(row.id, {
                                                                                                        status: value,
                                                                                                        checkIn: '',
                                                                                                        checkOut: '',
                                                                                                    });
                                                                                                }
                                                                                                else if (value === 'A' || value === 'HOLIDAY') {
                                                                                                    // Non-working statuses: clear and hide time fields
                                                                                                    updateRow(row.id, {
                                                                                                        status: value,
                                                                                                        checkIn: '',
                                                                                                        checkOut: '',
                                                                                                    });
                                                                                                }
                                                                                                else {
                                                                                                    // Empty/Select state: clear status and times
                                                                                                    updateRow(row.id, {
                                                                                                        status: '',
                                                                                                        checkIn: '',
                                                                                                        checkOut: '',
                                                                                                    });
                                                                                                }
                                                                                            }, children: [_jsx("option", { value: "", children: "Select" }), _jsx("option", { value: "P", children: "P" }), _jsx("option", { value: "A", children: "A" }), _jsx("option", { value: "HALF DAY", children: "HALF DAY" }), _jsx("option", { value: "HOLIDAY", children: "HOLIDAY" })] }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${statusCls}`, children: row.status })] }) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx(Select, { value: row.otHours, onChange: (e) => updateRow(row.id, { otHours: e.target.value }), disabled: isAbsentLike, children: otOptions.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) }) }), _jsx("td", { className: "px-3 py-2 align-top", children: editingSiteRowId === row.id ? (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs(Select, { value: row.mainContractor, className: showValidationErrors && !row.mainContractor && !isAbsentLike
                                                                                                ? 'border-rose-500 focus:ring-rose-500'
                                                                                                : undefined, onChange: (e) => {
                                                                                                const value = e.target.value;
                                                                                                updateRow(row.id, {
                                                                                                    mainContractor: value,
                                                                                                    projectId: '',
                                                                                                    site: '',
                                                                                                });
                                                                                            }, children: [_jsx("option", { value: "", children: "Main-Contractor" }), mainContractorOptions.map((c) => (_jsx("option", { value: c, children: c }, c)))] }), _jsxs(Select, { value: row.projectId, className: showValidationErrors && !row.projectId && !isAbsentLike
                                                                                                ? 'border-rose-500 focus:ring-rose-500'
                                                                                                : undefined, onChange: (e) => {
                                                                                                const value = e.target.value;
                                                                                                const sites = siteOptionsFor(row.mainContractor, value);
                                                                                                updateRow(row.id, {
                                                                                                    projectId: value,
                                                                                                    site: sites[0] || '',
                                                                                                });
                                                                                            }, disabled: !row.mainContractor, children: [_jsx("option", { value: "", children: "Project" }), projectOptionsFor(row.mainContractor).map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id)))] }), _jsxs(Select, { value: row.site, className: showValidationErrors && !row.site && !isAbsentLike
                                                                                                ? 'border-rose-500 focus:ring-rose-500'
                                                                                                : undefined, onChange: (e) => {
                                                                                                const value = e.target.value;
                                                                                                updateRow(row.id, { site: value });
                                                                                            }, disabled: !row.projectId, children: [_jsx("option", { value: "", children: "Site" }), siteOptionsFor(row.mainContractor, row.projectId).map((s) => (_jsx("option", { value: s, children: s }, s)))] }), _jsx("div", { className: "flex justify-end pt-1", children: _jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditingSiteRowId(null), children: "Done" }) })] })) : (_jsxs("button", { type: "button", className: `w-full text-left text-xs sm:text-sm${showValidationErrors && !row.site && !isAbsentLike
                                                                                        ? ' border border-rose-500 rounded-md'
                                                                                        : ''}`, onClick: () => {
                                                                                        if (isAbsentLike)
                                                                                            return;
                                                                                        setEditingSiteRowId(row.id);
                                                                                    }, children: [_jsx("div", { className: "font-medium", children: row.site || 'Select site' }), (row.mainContractor || row.projectId) && (_jsxs("div", { className: "zynq-muted text-[11px] leading-tight", children: [row.mainContractor || '—', row.mainContractor && row.projectId ? '  b7 ' : '', row.projectId ? projectNameById(row.projectId) || row.projectId : ''] }))] })) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx("input", { className: "zynq-input w-full", value: row.approvedBy, readOnly: true, disabled: true }) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx("input", { className: "zynq-input w-full", value: row.signature, onChange: (e) => updateRow(row.id, { signature: e.target.value }), placeholder: "Signature (optional)", disabled: isAbsentLike }) })] }, row.id));
                                                                }) })] }) })] }))] })] })] }) })] }));
}

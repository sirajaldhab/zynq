import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner, useIonToast } from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table from '../../ui/Table';
import Input from '../../ui/Input';
import Modal from '../../ui/Modal';
import { useAuth } from '../../auth/AuthContext';
import { fetchEmployees, fetchAttendance, fetchPayrolls, createPayroll, updatePayroll, } from '../../api/hrService';
import { chevronBackOutline } from 'ionicons/icons';
export default function HRPayrollDetails() {
    const navigate = useNavigate();
    const { employeeId, emiratesId } = useParams();
    const { role } = useAuth();
    const isAdmin = role === 'ADMIN';
    const [present] = useIonToast();
    const [employee, setEmployee] = React.useState(null);
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [editField, setEditField] = React.useState(null);
    const [editMonthKey, setEditMonthKey] = React.useState(null);
    const [editValue, setEditValue] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    React.useEffect(() => {
        async function load() {
            const token = localStorage.getItem('token') || undefined;
            try {
                setLoading(true);
                const empRes = await fetchEmployees({ page: 1, pageSize: 500, token });
                const allEmployees = empRes.data || [];
                const current = allEmployees.find((e) => e.id === employeeId && e.emiratesId === emiratesId);
                if (!current) {
                    present({ message: 'Employee not found for payroll details', color: 'danger', duration: 2000, position: 'top' });
                    setEmployee(null);
                }
                else {
                    setEmployee(current);
                }
                // We will build month rows from TWO sources:
                // 1) Attendance, reconstructed per month & employeeId using the same
                //    rules as the Employee Monthly page (no mixing of employees or
                //    months, and using a full calendar of days).
                // 2) Payroll records, which may introduce months that have manual
                //    adjustments but no attendance.
                const perMonth = new Map();
                const getMonthKey = (d) => {
                    const y = d.getFullYear();
                    const m = d.getMonth() + 1;
                    return `${y}-${String(m).padStart(2, '0')}`;
                };
                const getMonthLabel = (key) => {
                    const [yStr, mStr] = key.split('-');
                    const y = Number(yStr);
                    const m = Number(mStr || '1');
                    const d = new Date(y, m - 1, 1);
                    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                };
                // First pass: discover distinct months where this employee has
                // attendance, then for each month reconstruct a day list and aggregate
                // counts exactly like AttendanceEmployeeMonthly.tsx.
                if (employeeId) {
                    const broadAttRes = await fetchAttendance({ page: 1, pageSize: 2000, employeeId, token });
                    const broadAtt = (broadAttRes.data || []);
                    const monthKeys = new Set();
                    for (const r of broadAtt) {
                        const rawDate = r.date ?? r.check_in ?? r.checkIn;
                        if (!rawDate)
                            continue;
                        const dt = new Date(rawDate);
                        if (!dt.getTime())
                            continue;
                        const key = getMonthKey(dt);
                        monthKeys.add(key);
                    }
                    const targetEmiratesId = current?.emiratesId;
                    for (const key of monthKeys) {
                        const [yStr, mStr] = key.split('-');
                        const y = Number(yStr);
                        const m = Number(mStr || '1');
                        const monthIso = `${y}-${String(m).padStart(2, '0')}`;
                        const endDate = new Date(y, m, 0);
                        const startStr = `${monthIso}-01`;
                        const endStr = `${monthIso}-${String(endDate.getDate()).padStart(2, '0')}`;
                        // Scoped attendance for this employee + month, mirroring
                        // AttendanceEmployeeMonthly.tsx
                        const scopedRes = await fetchAttendance({
                            page: 1,
                            pageSize: 2000,
                            start: startStr,
                            end: endStr,
                            employeeId,
                            token,
                        });
                        const scoped = (scopedRes.data || []);
                        // Index by date (YYYY-MM-DD), with Emirates ID safety check
                        const byDate = new Map();
                        for (const a of scoped) {
                            const recEmiratesId = a.emiratesId ?? a.employee?.emiratesId;
                            if (targetEmiratesId && recEmiratesId && String(recEmiratesId) !== String(targetEmiratesId))
                                continue;
                            const rawDate = a.date ?? a.check_in ?? a.checkIn;
                            if (!rawDate)
                                continue;
                            const dStr = typeof rawDate === 'string' ? rawDate.slice(0, 10) : '';
                            if (dStr.slice(0, 7) !== monthIso)
                                continue;
                            if (dStr < startStr || dStr > endStr)
                                continue;
                            byDate.set(dStr, a);
                        }
                        let present = 0;
                        let halfDayCount = 0;
                        let halfDayValue = 0;
                        let paidLeave = 0;
                        let ot = 0;
                        // Rebuild the calendar days and aggregate using the same status
                        // normalization and OT parsing as Monthly.
                        for (let d = 1; d <= endDate.getDate(); d++) {
                            const dateStr = `${monthIso}-${String(d).padStart(2, '0')}`;
                            const a = byDate.get(dateStr);
                            if (a) {
                                const statusRaw = String(a.status || '').toUpperCase();
                                if (statusRaw === 'P' || statusRaw === 'PRESENT')
                                    present += 1;
                                else if (statusRaw === 'A' || statusRaw === 'ABSENT') {
                                    // Absent does not affect present/holiday/half-day counts
                                }
                                else if (statusRaw === 'HOLIDAY') {
                                    paidLeave += 1;
                                }
                                else if (statusRaw === 'HALF DAY' || statusRaw === 'HALF-DAY') {
                                    halfDayCount += 1;
                                }
                                const otVal = a.otHours;
                                const parsedOt = typeof otVal === 'number' ? otVal : Number(otVal || 0);
                                if (!Number.isNaN(parsedOt))
                                    ot += parsedOt;
                            }
                            else {
                                // Missing dates are treated as Absent in Monthly; they do not
                                // contribute to present/holiday/half-day or OT totals.
                            }
                        }
                        halfDayValue = halfDayCount * 0.5;
                        const daysInMonth = endDate.getDate();
                        const salary = current?.salary ?? 0;
                        const daySalary = daysInMonth > 0 ? salary / daysInMonth : 0;
                        if (!perMonth.has(key)) {
                            perMonth.set(key, {
                                key,
                                label: getMonthLabel(key),
                                salary,
                                daysInMonth,
                                daySalary,
                                present,
                                halfDayCount,
                                halfDayValue,
                                paidLeave,
                                ot,
                                other: 0,
                                previousGross: 0,
                                loan: 0,
                                loanRecovery: 0,
                                salaryPaid: 0,
                                notes: '',
                            });
                        }
                        else {
                            const existing = perMonth.get(key);
                            perMonth.set(key, {
                                ...existing,
                                salary,
                                daysInMonth,
                                daySalary,
                                present,
                                halfDayCount,
                                halfDayValue,
                                paidLeave,
                                ot,
                            });
                        }
                    }
                }
                // Second pass: merge any saved payroll adjustments and salary snapshots
                // from payroll records. Also ensure months that have payroll but no
                // attendance still appear in the table.
                if (employeeId) {
                    try {
                        const payrollRes = await fetchPayrolls({ page: 1, pageSize: 500, employeeId, token });
                        const payrollRows = payrollRes.data || [];
                        for (const p of payrollRows) {
                            if (!p.month)
                                continue;
                            // Validate by Emirates ID when joined employee is present
                            const joinedEid = p.employee?.emiratesId;
                            if (joinedEid && emiratesId && joinedEid.trim() !== emiratesId.trim())
                                continue;
                            const d = new Date(p.month);
                            if (!d.getTime())
                                continue;
                            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                            // If this month was not present from attendance, create a base row
                            if (!perMonth.has(key)) {
                                const [yStr, mStr] = key.split('-');
                                const y = Number(yStr);
                                const m = Number(mStr || '1');
                                const daysInMonth = new Date(y, m, 0).getDate();
                                const salary = employee?.salary ?? 0;
                                const daySalary = daysInMonth > 0 ? salary / daysInMonth : 0;
                                perMonth.set(key, {
                                    key,
                                    label: getMonthLabel(key),
                                    salary,
                                    daysInMonth,
                                    daySalary,
                                    present: 0,
                                    halfDayCount: 0,
                                    halfDayValue: 0,
                                    paidLeave: 0,
                                    ot: 0,
                                    other: 0,
                                    previousGross: 0,
                                    loan: 0,
                                    loanRecovery: 0,
                                    salaryPaid: 0,
                                    notes: '',
                                });
                            }
                            const base = perMonth.get(key);
                            if (!base)
                                continue;
                            if (!p.deductions_json)
                                continue;
                            let extra = p.deductions_json;
                            if (typeof extra === 'string') {
                                try {
                                    extra = JSON.parse(extra);
                                }
                                catch {
                                    extra = {};
                                }
                            }
                            // Salary snapshot: if present, override salary/daySalary for this month only
                            let salary = base.salary;
                            if (typeof extra.salary === 'number' && !Number.isNaN(extra.salary)) {
                                salary = extra.salary;
                            }
                            const daysInMonth = base.daysInMonth || 1;
                            const daySalary = daysInMonth > 0 ? salary / daysInMonth : 0;
                            const halfDayCount = typeof extra.halfDayCount === 'number' ? extra.halfDayCount : base.halfDayCount;
                            const halfDayValue = halfDayCount * 0.5;
                            const other = typeof extra.other === 'number' ? extra.other : base.other;
                            const loan = typeof extra.loan === 'number' ? extra.loan : base.loan;
                            const loanRecovery = typeof extra.loanRecovery === 'number' ? extra.loanRecovery : base.loanRecovery;
                            const salaryPaid = typeof extra.salaryPaid === 'number' ? extra.salaryPaid : base.salaryPaid;
                            const notes = typeof extra.notes === 'string' ? extra.notes : base.notes;
                            perMonth.set(key, {
                                ...base,
                                salary,
                                daySalary,
                                halfDayCount,
                                halfDayValue,
                                other,
                                loan,
                                loanRecovery,
                                salaryPaid,
                                notes,
                            });
                        }
                    }
                    catch {
                        // ignore payroll merge errors, keep computed rows only
                    }
                }
                // Sort months strictly in chronological order (oldest first) for calculations,
                // but store them in descending order so the latest month appears at the top
                // of the table for the selected employee.
                const sortedAsc = Array.from(perMonth.values()).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
                const sortedDesc = [...sortedAsc].reverse();
                setRows(sortedDesc);
            }
            catch {
                present({ message: 'Failed to load payroll details', color: 'danger', duration: 2000, position: 'top' });
                setRows([]);
            }
            finally {
                setLoading(false);
            }
        }
        if (employeeId && emiratesId) {
            load();
        }
    }, [employeeId, emiratesId, present]);
    function isRowEditable(row) {
        if (isAdmin)
            return true;
        // row.key format: YYYY-MM
        const [yStr, mStr] = row.key.split('-');
        const y = Number(yStr);
        const m = Number(mStr || '1'); // 1-12
        if (!y || !m)
            return false;
        const monthIndex = m - 1; // 0-based
        const nextMonthIndex = (monthIndex + 1) % 12;
        const lockYear = monthIndex === 11 ? y + 1 : y;
        const lockDate = new Date(lockYear, nextMonthIndex, 25, 23, 59, 59, 999);
        const now = new Date();
        return now.getTime() <= lockDate.getTime();
    }
    function openEdit(field, row) {
        if (!isRowEditable(row)) {
            present({ message: 'Editing is locked for this month.', color: 'medium', duration: 2000, position: 'top' });
            return;
        }
        setEditField(field);
        setEditMonthKey(row.key);
        const currentValue = field === 'notes'
            ? row.notes
            : String(field === 'other'
                ? row.other
                : field === 'loan'
                    ? row.loan
                    : field === 'loanRecovery'
                        ? row.loanRecovery
                        : row.salaryPaid);
        setEditValue(currentValue);
        setEditOpen(true);
    }
    async function saveEdit() {
        if (!editField || !editMonthKey || !employee || !employeeId) {
            setEditOpen(false);
            return;
        }
        const monthKey = editMonthKey;
        const parsedValue = editField === 'notes' ? editValue : Number(editValue || 0);
        // Update local state first and capture the updated row for this month
        let updatedRow = null;
        setRows((prev) => prev.map((row) => {
            if (row.key !== monthKey)
                return row;
            let next;
            if (editField === 'notes')
                next = { ...row, notes: String(parsedValue) };
            else if (editField === 'other')
                next = { ...row, other: Number(parsedValue) };
            else if (editField === 'loan')
                next = { ...row, loan: Number(parsedValue) };
            else if (editField === 'loanRecovery')
                next = { ...row, loanRecovery: Number(parsedValue) };
            else
                next = { ...row, salaryPaid: Number(parsedValue) };
            updatedRow = next;
            return next;
        }));
        // Persist to backend using payroll record per employee + month, including Gross
        try {
            setSaving(true);
            const token = localStorage.getItem('token') || undefined;
            const monthDateStr = `${monthKey}-01`;
            // Find the updated row so we send full extras together
            const target = updatedRow ?? rows.find((r) => r.key === monthKey);
            const effective = target
                ? {
                    other: target.other,
                    loan: target.loan,
                    loanRecovery: target.loanRecovery,
                    salaryPaid: target.salaryPaid,
                    notes: target.notes,
                    // Persist month-specific salary snapshot so historical months don't change
                    salary: target.salary,
                }
                : { other: 0, loan: 0, loanRecovery: 0, salaryPaid: 0, notes: '' };
            // Apply the just-edited value
            const payloadExtras = { ...effective };
            if (editField === 'notes')
                payloadExtras.notes = String(parsedValue);
            else if (editField === 'other')
                payloadExtras.other = Number(parsedValue);
            else if (editField === 'loan')
                payloadExtras.loan = Number(parsedValue);
            else if (editField === 'loanRecovery')
                payloadExtras.loanRecovery = Number(parsedValue);
            else
                payloadExtras.salaryPaid = Number(parsedValue);
            // Compute Gross for this month using the same logic as grossByKey
            let gross = 0;
            if (target) {
                const [yStr, mStr] = monthKey.split('-');
                const y = Number(yStr);
                const m = Number(mStr || '1');
                const prevYear = m === 1 ? y - 1 : y;
                const prevMonth = m === 1 ? 12 : m - 1;
                const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
                const prevGross = grossByKey.get(prevKey) ?? 0;
                const total = (target.present + target.paidLeave + target.ot) * target.daySalary + (payloadExtras.other ?? 0);
                const salaryPaidVal = payloadExtras.salaryPaid ?? target.salaryPaid ?? 0;
                const loanVal = payloadExtras.loan ?? target.loan ?? 0;
                gross = prevGross + total - salaryPaidVal - loanVal;
            }
            const existing = await fetchPayrolls({ page: 1, pageSize: 1, employeeId, month: monthDateStr, token });
            const existingRow = (existing.data || [])[0];
            if (!existingRow) {
                await createPayroll({
                    employeeId,
                    month: monthDateStr,
                    gross,
                    net: 0,
                    deductions_json: payloadExtras,
                    token,
                });
            }
            else {
                await updatePayroll({ id: existingRow.id, token }, { gross, deductions_json: payloadExtras });
            }
            present({ message: 'Payroll details saved', color: 'success', duration: 1500, position: 'top' });
        }
        catch {
            present({ message: 'Failed to save payroll details', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setSaving(false);
            setEditOpen(false);
        }
    }
    // Derived Gross per month, based on calendar sequence:
    // Total = (Present + HalfDayValue + Paid Leave + OT) * DaySalary + (Other + P.Gross)
    // Gross = Total - SalaryPaid - Loan
    const grossByKey = React.useMemo(() => {
        const map = new Map();
        // Work on ascending order so previous month is always processed first
        const sortedAsc = [...rows].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
        for (const row of sortedAsc) {
            const [yStr, mStr] = row.key.split('-');
            const y = Number(yStr);
            const m = Number(mStr || '1');
            // Compute previous calendar month key (even if that month has no row)
            const prevYear = m === 1 ? y - 1 : y;
            const prevMonth = m === 1 ? 12 : m - 1;
            const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
            // If the immediate previous calendar month doesn't exist in data, treat its Gross as 0
            const prevGross = map.get(prevKey) ?? 0;
            const total = (row.present + row.halfDayValue + row.paidLeave + row.ot) * row.daySalary + (row.other + prevGross);
            const gross = total - row.salaryPaid - row.loan;
            map.set(row.key, gross);
        }
        return map;
    }, [rows]);
    const columns = [
        { key: 'label', header: 'Month' },
        { key: 'daySalary', header: 'Day Salary', render: (r) => (r.daySalary ? r.daySalary.toFixed(2) : '0.00') },
        { key: 'present', header: 'Present' },
        { key: 'halfDayValue', header: 'Half-Day', render: (r) => (r.halfDayValue ? r.halfDayValue.toFixed(2) : '0.00') },
        { key: 'paidLeave', header: 'Paid Leave' },
        { key: 'ot', header: 'OT', render: (r) => r.ot.toFixed(1) },
        {
            key: 'other',
            header: 'Other',
            render: (r) => (isRowEditable(r) ? (_jsx("button", { type: "button", className: "text-left text-[color:var(--accent)] hover:underline", onClick: () => openEdit('other', r), children: r.other ? r.other.toFixed(2) : '0.00' })) : (_jsx("span", { className: "text-sm text-[color:var(--text-secondary)] opacity-70 cursor-not-allowed", children: r.other ? r.other.toFixed(2) : '0.00' }))),
        },
        {
            key: 'previousGross',
            header: 'P.Gross',
            render: (r) => {
                const [yStr, mStr] = r.key.split('-');
                const y = Number(yStr);
                const m = Number(mStr || '1');
                const prevYear = m === 1 ? y - 1 : y;
                const prevMonth = m === 1 ? 12 : m - 1;
                const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
                const prevGross = grossByKey.get(prevKey) ?? 0;
                const colorClass = prevGross > 0
                    ? 'text-green-500'
                    : prevGross < 0
                        ? 'text-red-500'
                        : 'text-[color:var(--text-secondary)]';
                return _jsx("span", { className: colorClass, children: prevGross.toFixed(2) });
            },
        },
        {
            key: 'total',
            header: 'Total',
            render: (r) => {
                const [yStr, mStr] = r.key.split('-');
                const y = Number(yStr);
                const m = Number(mStr || '1');
                const prevYear = m === 1 ? y - 1 : y;
                const prevMonth = m === 1 ? 12 : m - 1;
                const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
                const prevGross = grossByKey.get(prevKey) ?? 0;
                const total = (r.present + r.halfDayValue + r.paidLeave + r.ot) * r.daySalary + (r.other + prevGross);
                return total ? total.toFixed(2) : '0.00';
            },
        },
        {
            key: 'salaryPaid',
            header: 'Salary Paid',
            render: (r) => (isRowEditable(r) ? (_jsx("button", { type: "button", className: "text-left text-[color:var(--accent)] hover:underline", onClick: () => openEdit('salaryPaid', r), children: r.salaryPaid ? r.salaryPaid.toFixed(2) : '0.00' })) : (_jsx("span", { className: "text-sm text-[color:var(--text-secondary)] opacity-70 cursor-not-allowed", children: r.salaryPaid ? r.salaryPaid.toFixed(2) : '0.00' }))),
        },
        {
            key: 'loan',
            header: 'Loan',
            render: (r) => (isRowEditable(r) ? (_jsx("button", { type: "button", className: "text-left text-[color:var(--accent)] hover:underline", onClick: () => openEdit('loan', r), children: r.loan ? r.loan.toFixed(2) : '0.00' })) : (_jsx("span", { className: "text-sm text-[color:var(--text-secondary)] opacity-70 cursor-not-allowed", children: r.loan ? r.loan.toFixed(2) : '0.00' }))),
        },
        {
            key: 'gross',
            header: 'Gross',
            render: (r) => {
                const gross = grossByKey.get(r.key) ?? 0;
                const colorClass = gross > 0
                    ? 'text-green-500'
                    : gross < 0
                        ? 'text-red-500'
                        : 'text-[color:var(--text-secondary)]';
                return (_jsx("span", { className: colorClass, children: gross.toFixed(2) }));
            },
        },
        {
            key: 'notes',
            header: 'Notes',
            render: (r) => (isRowEditable(r) ? (_jsx("button", { type: "button", className: "text-left text-[color:var(--accent)] hover:underline max-w-xs truncate", onClick: () => openEdit('notes', r), children: r.notes || '—' })) : (_jsx("span", { className: "text-sm text-[color:var(--text-secondary)] opacity-70 max-w-xs truncate cursor-not-allowed", children: r.notes || '—' }))),
        },
    ];
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-6", children: [_jsx("div", { className: "text-lg font-semibold", children: "Payroll Details" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > HR > Payroll > Details" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/hr/payroll'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(IonSpinner, { name: "dots" }) })) : (_jsxs(_Fragment, { children: [employee && (_jsxs("div", { className: "mt-4 space-y-1 text-sm", children: [_jsxs("div", { children: [_jsx("strong", { children: "Company:" }), " ", employee.company] }), _jsxs("div", { children: [_jsx("strong", { children: "Employee Name:" }), " ", employee.employeeName] }), _jsxs("div", { children: [_jsx("strong", { children: "Emirates ID:" }), " ", employee.emiratesId] }), _jsxs("div", { children: [_jsx("strong", { children: "Salary:" }), " ", employee.salary.toLocaleString()] })] })), _jsx("div", { className: "mt-6", children: _jsx(Table, { columns: columns, data: rows, emptyText: "No payroll data available" }) })] })), _jsx(Modal, { open: editOpen, onClose: () => !saving && setEditOpen(false), title: editField ? `Edit ${editField === 'other'
                            ? 'Other'
                            : editField === 'loan'
                                ? 'Loan'
                                : editField === 'loanRecovery'
                                    ? 'Loan Recovery'
                                    : editField === 'salaryPaid'
                                        ? 'Salary Paid'
                                        : 'Notes'}` : '', footer: (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: () => setEditOpen(false), disabled: saving, children: "Cancel" }), _jsx(Button, { size: "sm", onClick: saveEdit, disabled: saving || !editField || !editMonthKey, children: saving ? 'Saving...' : 'Save' })] })), children: editField && (_jsx("div", { className: "space-y-3 mt-1", children: _jsx(Input, { type: editField === 'notes' ? 'text' : 'number', value: editValue, onChange: (e) => setEditValue(e.target.value) }) })) })] })] }));
}

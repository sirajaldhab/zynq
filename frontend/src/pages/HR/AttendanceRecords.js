import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Table from '../../ui/Table';
import { fetchEmployees, fetchAttendance } from '../../api/hrService';
import { chevronBackOutline } from 'ionicons/icons';
export default function HRAttendanceRecords() {
    const navigate = useNavigate();
    const [employees, setEmployees] = React.useState([]);
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [companyFilter, setCompanyFilter] = React.useState('');
    const [employeeFilter, setEmployeeFilter] = React.useState('');
    const [month, setMonth] = React.useState(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    });
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');
    function resetFilters() {
        setCompanyFilter('');
        setEmployeeFilter('');
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        setMonth(`${y}-${m}`);
        setStartDate('');
        setEndDate('');
    }
    const loadRecords = React.useCallback(async () => {
        const token = localStorage.getItem('token') || undefined;
        try {
            try {
                setLoading(true);
                const empRes = await fetchEmployees({ page: 1, pageSize: 500, token });
                const allEmployees = empRes.data || [];
                setEmployees(allEmployees);
                // Determine date range based on month and optional overrides
                let rangeStart;
                let rangeEnd;
                if (startDate || endDate || month) {
                    if (startDate)
                        rangeStart = startDate;
                    if (endDate)
                        rangeEnd = endDate;
                    if (month) {
                        const [yStr, mStr] = month.split('-');
                        const y = Number(yStr);
                        const m = Number(mStr || '1') - 1;
                        if (!rangeStart) {
                            rangeStart = new Date(y, m, 1).toISOString().slice(0, 10);
                        }
                        if (!rangeEnd) {
                            rangeEnd = new Date(y, m + 1, 0).toISOString().slice(0, 10);
                        }
                    }
                }
                const attRes = await fetchAttendance({
                    page: 1,
                    pageSize: 2000,
                    start: rangeStart,
                    end: rangeEnd,
                    token,
                });
                const att = attRes.data || [];
                // Use Emirates ID as the stable key for grouping and lookup.
                // We will then aggregate statuses and OT using the same
                // normalization rules as the Monthly Attendance Detail page, so the
                // numbers match exactly for a given employee + month.
                const byId = new Map();
                for (const e of allEmployees) {
                    if (!e.emiratesId)
                        continue;
                    byId.set(e.emiratesId, {
                        employeeId: e.id,
                        company: e.company,
                        employeeName: e.employeeName,
                        emiratesId: e.emiratesId,
                        status: e.status,
                        salary: e.salary,
                        present: 0,
                        absent: 0,
                        holiday: 0,
                        halfDay: 0,
                        ot: 0,
                        monthlySalary: e.salary,
                    });
                }
                for (const r of att) {
                    // Prefer Emirates ID directly from the joined employee if available
                    const eidFromJoined = r.employee?.emiratesId;
                    const eidFromFlat = r.emiratesId;
                    const emiratesKey = (eidFromJoined || eidFromFlat || '').trim();
                    if (!emiratesKey)
                        continue;
                    const row = byId.get(emiratesKey);
                    if (!row)
                        continue;
                    // Enforce that the record truly belongs to the selected month, just
                    // like Monthly Attendance Detail does (it slices the date string to
                    // YYYY-MM and compares to the current month value).
                    if (month) {
                        const rawDate = r.date ?? r.check_in ?? r.checkIn;
                        if (!rawDate)
                            continue;
                        const dStr = typeof rawDate === 'string' ? rawDate.slice(0, 10) : '';
                        if (dStr.slice(0, 7) !== month)
                            continue;
                    }
                    // Normalize status exactly like Monthly Attendance Detail
                    const s = String(r.status || '').toUpperCase();
                    if (s === 'P' || s === 'PRESENT')
                        row.present += 1;
                    else if (s === 'A' || s === 'ABSENT')
                        row.absent += 1;
                    else if (s === 'HOLIDAY')
                        row.holiday += 1;
                    else if (s === 'HALF DAY' || s === 'HALF-DAY')
                        row.halfDay += 1;
                    // OT: Monthly Attendance Detail uses otHours directly as a number
                    const otVal = r.otHours;
                    const parsedOt = typeof otVal === 'number' ? otVal : Number(otVal || 0);
                    if (!Number.isNaN(parsedOt)) {
                        row.ot += parsedOt;
                    }
                }
                let result = Array.from(byId.values());
                // Compute one-day salary based on days in selected month and apply formula:
                // Monthly Salary = (Present + Holiday + Half Day + OT) * One-day Salary
                if (month) {
                    const [yStr, mStr] = month.split('-');
                    const y = Number(yStr);
                    const mIndex = Number(mStr || '1');
                    if (!Number.isNaN(y) && !Number.isNaN(mIndex) && mIndex >= 1 && mIndex <= 12) {
                        const daysInMonth = new Date(y, mIndex, 0).getDate();
                        if (daysInMonth > 0) {
                            result = result.map((row) => {
                                const oneDaySalary = row.salary / daysInMonth;
                                const payableDays = row.present + row.holiday + row.halfDay * 0.5 + row.ot;
                                const monthlySalary = oneDaySalary * payableDays;
                                return { ...row, monthlySalary };
                            });
                        }
                    }
                }
                if (companyFilter) {
                    result = result.filter((r) => r.company === companyFilter);
                }
                if (employeeFilter) {
                    result = result.filter((r) => r.employeeId === employeeFilter);
                }
                setRows(result);
            }
            finally {
                setLoading(false);
            }
        }
        catch {
            setRows([]);
            setLoading(false);
        }
    }, [companyFilter, employeeFilter, month, startDate, endDate]);
    React.useEffect(() => {
        loadRecords();
    }, [loadRecords]);
    useIonViewWillEnter(() => {
        // Ensure the latest attendance data is shown whenever the view becomes active
        loadRecords();
    });
    const companyOptions = React.useMemo(() => Array.from(new Set(employees.map((e) => e.company).filter(Boolean))), [employees]);
    const cols = [
        { key: 'company', header: 'COMPANY', render: (r) => r.company },
        {
            key: 'employeeName',
            header: 'EMPLOYEE NAME',
            render: (r) => (_jsx("button", { type: "button", className: "text-left text-[color:var(--accent)] hover:underline", onClick: () => navigate(`/hr/attendance/employee/${r.employeeId}`), children: r.employeeName })),
        },
        { key: 'emiratesId', header: 'EMIRATES ID', render: (r) => r.emiratesId },
        {
            key: 'status',
            header: 'STATUS',
            render: (r) => {
                const v = String(r.status || '').toUpperCase();
                const isActive = v === 'ACTIVE';
                const label = v || 'INACTIVE';
                const cls = isActive
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-rose-500/10 text-rose-500';
                return (_jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${cls}`, children: label }));
            },
        },
        { key: 'salary', header: 'SALARY', render: (r) => r.salary.toLocaleString() },
        { key: 'present', header: 'Present', render: (r) => r.present },
        { key: 'absent', header: 'Absent', render: (r) => r.absent },
        { key: 'holiday', header: 'Holiday', render: (r) => r.holiday },
        { key: 'halfDay', header: 'Half day', render: (r) => r.halfDay },
        { key: 'ot', header: 'OT', render: (r) => r.ot.toFixed(1) },
        { key: 'monthlySalary', header: 'Monthly Salary', render: (r) => r.monthlySalary.toLocaleString() },
    ];
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "lg:hidden space-y-1", children: [_jsx("div", { className: "text-base font-semibold", children: "Attendance Records" }), _jsx("div", { className: "text-xs uppercase tracking-wide text-[color:var(--text-secondary)]", children: "HR / Attendance" })] }), _jsxs("div", { className: "hidden lg:block", children: [_jsx("div", { className: "text-lgstitution font-semibold", children: "HR / Attendance Records" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > HR > Attendance > Records" })] }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2 w-full sm:w-auto justify-center", onClick: () => navigate('/hr/attendance'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [_jsx(CardTitle, { children: "Attendance Records (Current Month)" }), _jsx("div", { children: _jsx(Button, { variant: "secondary", size: "sm", className: "w-full sm:w-auto", onClick: resetFilters, children: "Reset Filters" }) })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4", children: [_jsxs(Select, { label: "Company", value: companyFilter, onChange: (e) => setCompanyFilter(e.target.value), children: [_jsx("option", { value: "", children: "All Companies" }), companyOptions.map((c) => (_jsx("option", { value: c, children: c }, c)))] }), _jsxs(Select, { label: "Employee", value: employeeFilter, onChange: (e) => setEmployeeFilter(e.target.value), children: [_jsx("option", { value: "", children: "All Employees" }), employees.map((e) => (_jsx("option", { value: e.id, children: e.employeeName }, e.id)))] }), _jsx(Input, { label: "Month", type: "month", value: month, onChange: (e) => setMonth(e.target.value) }), _jsxs("div", { className: "grid grid-cols-1 gap-2 sm:grid-cols-2", children: [_jsx(Input, { label: "From", type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value) }), _jsx(Input, { label: "To", type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value) })] })] }), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(IonSpinner, { name: "dots" }) })) : (_jsx(Table, { columns: cols, data: rows, emptyText: "No records" }))] })] })] }) })] }));
}

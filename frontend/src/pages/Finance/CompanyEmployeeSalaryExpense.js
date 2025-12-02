import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner, useIonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { chevronBackOutline } from 'ionicons/icons';
import { fetchEmployees, fetchPayrolls } from '../../api/hrService';
const columns = [
    { key: 'company', header: 'Company' },
    { key: 'employeeName', header: 'Employee Name' },
    { key: 'emiratesId', header: 'Emirates ID' },
    {
        key: 'totalSalary',
        header: 'Total Salary',
        render: (r) => r.totalSalary.toLocaleString(),
    },
];
export default function CompanyEmployeeSalaryExpensePage() {
    const navigate = useNavigate();
    const [present] = useIonToast();
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [filterCompany, setFilterCompany] = React.useState('');
    const [filterMonth, setFilterMonth] = React.useState('');
    const [filterSearch, setFilterSearch] = React.useState('');
    React.useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                setLoading(true);
                // 1. Load all employees (single large page)
                const empRes = await fetchEmployees({ page: 1, pageSize: 1000, token });
                const employees = empRes.data || [];
                // Maps for strict joins: by ID and by Emirates ID
                const idToEmployee = new Map();
                const eidToEmployee = new Map();
                for (const e of employees) {
                    idToEmployee.set(e.id, e);
                    const eid = (e.emiratesId || '').trim();
                    if (eid && !eidToEmployee.has(eid)) {
                        eidToEmployee.set(eid, e);
                    }
                }
                // 2. Load payroll records (single large page)
                const payrollRes = await fetchPayrolls({ page: 1, pageSize: 1000, token });
                const payrolls = payrollRes.data || [];
                const salaryRows = [];
                for (const p of payrolls) {
                    // Derive Emirates ID strictly and match employee by Emirates ID
                    const eidFromJoined = p.employee?.emiratesId;
                    let emiratesId = (eidFromJoined || '').trim();
                    if (!emiratesId) {
                        const empById = idToEmployee.get(p.employeeId);
                        emiratesId = (empById?.emiratesId || '').trim();
                    }
                    if (!emiratesId)
                        continue;
                    const emp = eidToEmployee.get(emiratesId);
                    if (!emp)
                        continue;
                    // Parse deductions_json for Salary Paid + Loan
                    let extras = p.deductions_json ?? {};
                    if (typeof extras === 'string') {
                        try {
                            extras = JSON.parse(extras);
                        }
                        catch {
                            extras = {};
                        }
                    }
                    const salaryPaid = typeof extras.salaryPaid === 'number' && !Number.isNaN(extras.salaryPaid)
                        ? extras.salaryPaid
                        : 0;
                    const loan = typeof extras.loan === 'number' && !Number.isNaN(extras.loan)
                        ? extras.loan
                        : 0;
                    // Only include months where both Salary Paid and Loan are present (non-zero or explicitly set)
                    if (extras.salaryPaid === undefined || extras.loan === undefined)
                        continue;
                    if (!p.month)
                        continue;
                    const d = new Date(p.month);
                    if (!d.getTime())
                        continue;
                    const monthLabel = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                    const totalSalary = salaryPaid + loan;
                    salaryRows.push({
                        month: monthLabel,
                        company: emp.company,
                        employeeName: emp.employeeName,
                        emiratesId: emp.emiratesId,
                        totalSalary,
                    });
                }
                // Sort by month (descending) then by employee name
                salaryRows.sort((a, b) => {
                    const ad = new Date(a.month).getTime();
                    const bd = new Date(b.month).getTime();
                    if (ad !== bd)
                        return bd - ad;
                    return a.employeeName.localeCompare(b.employeeName);
                });
                setRows(salaryRows);
            }
            catch (e) {
                console.error('Failed to load company employee salary expenses', e);
                present({ message: 'Failed to load salary expenses', color: 'danger', duration: 2000, position: 'top' });
                setRows([]);
            }
            finally {
                setLoading(false);
            }
        })();
    }, [present]);
    const viewRows = React.useMemo(() => {
        const q = (filterSearch || '').toLowerCase();
        return rows.filter((r) => {
            if (filterCompany && r.company !== filterCompany)
                return false;
            if (filterMonth && r.month !== filterMonth)
                return false;
            if (q) {
                const name = (r.employeeName || '').toLowerCase();
                const eid = (r.emiratesId || '').toLowerCase();
                if (!name.includes(q) && !eid.includes(q))
                    return false;
            }
            return true;
        });
    }, [rows, filterCompany, filterMonth, filterSearch]);
    const totalAllEmployees = React.useMemo(() => viewRows.reduce((sum, r) => sum + (r.totalSalary || 0), 0), [viewRows]);
    function resetFilters() {
        setFilterCompany('');
        setFilterMonth('');
        setFilterSearch('');
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "text-lg font-semibold", children: "Finance / Expenses / Company Employee Salary" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Finance > Expenses > Company Employee Salary" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/finance/expenses/manpower'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "Total Salary (All Employees)" }), _jsx(CardContent, { className: "text-2xl font-semibold", children: _jsx("span", { className: "text-[color:var(--danger)]", children: totalAllEmployees.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsx(CardTitle, { children: "Company Employee Salary Expenses" }), _jsx(Button, { variant: "secondary", size: "sm", onClick: resetFilters, children: "Reset Filters" })] }) }), _jsx(CardContent, { children: loading ? (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx(IonSpinner, { name: "dots" }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4", children: [_jsxs(Select, { label: "Company", value: filterCompany, onChange: (e) => setFilterCompany(e.target.value), children: [_jsx("option", { value: "", children: "All Companies" }), Array.from(new Set(rows.map((r) => r.company))).sort().map((company) => (_jsx("option", { value: company, children: company }, company)))] }), _jsxs(Select, { label: "Month", value: filterMonth, onChange: (e) => setFilterMonth(e.target.value), children: [_jsx("option", { value: "", children: "All Months" }), Array.from(new Set(rows.map((r) => r.month))).map((month) => (_jsx("option", { value: month, children: month }, month)))] }), _jsx(Input, { label: "Search Employee / Emirates ID", placeholder: "Type name or Emirates ID", value: filterSearch, onChange: (e) => setFilterSearch(e.target.value) })] }), Array.from(viewRows.reduce((acc, row) => {
                                                const key = row.month;
                                                if (!acc.has(key))
                                                    acc.set(key, []);
                                                acc.get(key).push(row);
                                                return acc;
                                            }, new Map())).map(([month, monthRows]) => (_jsxs(Card, { className: "mt-4", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: month }) }), _jsxs(CardContent, { children: [_jsx(Table, { columns: columns, data: monthRows, emptyText: "No salary expenses yet" }), _jsxs("div", { className: "mt-2 text-sm", children: [_jsx("span", { className: "zynq-muted mr-1", children: "Subtotal:" }), _jsx("span", { className: "font-semibold text-[color:var(--danger)]", children: monthRows
                                                                            .reduce((sum, r) => sum + (r.totalSalary || 0), 0)
                                                                            .toLocaleString(undefined, {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        }) })] })] })] }, month)))] })) })] })] }) })] }));
}

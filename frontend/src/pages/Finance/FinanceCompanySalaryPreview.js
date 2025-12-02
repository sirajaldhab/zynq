import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, fetchPayrolls } from '../../api/hrService';
const columns = [
    { key: 'company', header: 'Company' },
    { key: 'employeeName', header: 'Employee Name' },
    { key: 'emiratesId', header: 'Emirates ID' },
    {
        key: 'totalSalary',
        header: 'Total Salary',
        render: (r) => r.totalSalary.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
    },
];
export default function FinanceCompanySalaryPreviewPage() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                setLoading(true);
                const empRes = await fetchEmployees({ page: 1, pageSize: 1000, token });
                const employees = empRes.data || [];
                const idToEmployee = new Map();
                const eidToEmployee = new Map();
                for (const e of employees) {
                    idToEmployee.set(e.id, e);
                    const eid = (e.emiratesId || '').trim();
                    if (eid && !eidToEmployee.has(eid)) {
                        eidToEmployee.set(eid, e);
                    }
                }
                const payrollRes = await fetchPayrolls({ page: 1, pageSize: 1000, token });
                const payrolls = payrollRes.data || [];
                const salaryRows = [];
                for (const p of payrolls) {
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
                    if (extras.salaryPaid === undefined || extras.loan === undefined) {
                        continue;
                    }
                    const totalSalary = salaryPaid + loan;
                    salaryRows.push({
                        id: p.id,
                        company: emp.company,
                        employeeName: emp.employeeName,
                        emiratesId: emp.emiratesId,
                        totalSalary,
                    });
                }
                setRows(salaryRows);
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    const viewRows = useMemo(() => rows, [rows]);
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold", children: "Finance / Company Employee Salary (Read Only)" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Finance > Company Employee Salary Preview" })] }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate('/finance'), children: "Back to Finance" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Company Employee Salary (All)" }) }), _jsx(CardContent, { children: _jsx(Table, { columns: columns, data: viewRows, emptyText: "No salary expenses" }) })] })] })] }));
}

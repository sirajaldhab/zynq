import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner, useIonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import { usePermissions } from '../../auth/usePermissions';
import Button from '../../ui/Button';
import Table from '../../ui/Table';
import Pagination from '../../ui/Pagination';
import { useQueryParam } from '../../hooks/useQueryParam';
import { fetchEmployees } from '../../api/hrService';
import { chevronBackOutline } from 'ionicons/icons';
export default function HRPayroll() {
    const navigate = useNavigate();
    const [present] = useIonToast();
    const { can } = usePermissions();
    const [page, setPage] = useQueryParam('page', 1);
    const pageSize = 10;
    const [rows, setRows] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const columns = [
        { key: 'company', header: 'Company' },
        {
            key: 'employeeName',
            header: 'Employee Name',
            render: (r) => (_jsx("button", { type: "button", className: "text-left text-[color:var(--accent)] hover:underline", onClick: () => {
                    if (!can('HR.Payroll.Details.View'))
                        return;
                    navigate(`/hr/payroll/${r.id}/${encodeURIComponent(r.emiratesId)}`);
                }, children: r.employeeName })),
        },
        { key: 'emiratesId', header: 'Emirates ID' },
        {
            key: 'status',
            header: 'Status',
            render: (r) => {
                const s = (r.status || '').toUpperCase();
                const cls = s === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : s === 'INACTIVE'
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-slate-500/10 text-slate-400';
                return (_jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${cls}`, children: s }));
            },
        },
        { key: 'basicSalary', header: 'Basic Salary', render: () => '' },
        { key: 'paidLeave', header: 'Paid Leave', render: () => '' },
        { key: 'ot', header: 'OT', render: () => '' },
        { key: 'advance', header: 'Advance', render: () => '' },
        { key: 'gross', header: 'Gross', render: () => '' },
    ];
    async function load() {
        const token = localStorage.getItem('token') || undefined;
        try {
            setLoading(true);
            const res = await fetchEmployees({ page, pageSize, token });
            setRows(res.data);
            setTotal(res.total ?? res.data.length);
        }
        catch (e) {
            present({ message: 'Failed to load employees for payroll', color: 'danger', duration: 2000, position: 'top' });
            setRows([]);
            setTotal(0);
        }
        finally {
            setLoading(false);
        }
    }
    React.useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)]", children: _jsxs("div", { className: "px-4 py-8 sm:px-6 lg:px-8 space-y-6", children: [_jsx("div", { className: "text-lg font-semibold", children: "Payroll" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > HR > Payroll" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/hr'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs("div", { className: "mt-4", children: [loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(IonSpinner, { name: "dots" }) })) : (_jsx(Table, { columns: columns, data: rows, emptyText: "No employees available for payroll" })), _jsx("div", { className: "mt-4", children: _jsx(Pagination, { page: page, pageSize: pageSize, total: total, onChange: setPage }) })] })] }) })] }));
}

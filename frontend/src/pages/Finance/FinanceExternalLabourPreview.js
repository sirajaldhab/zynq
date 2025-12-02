import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { useNavigate } from 'react-router-dom';
import { fetchExternalLabourExpenses } from '../../api/externalLabourExpenseService';
const columns = [
    { key: 'supplier', header: 'Supplier' },
    { key: 'month', header: 'Month' },
    {
        key: 'paidAmount',
        header: 'Paid Amount',
        render: (r) => r.paidAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
    },
];
export default function FinanceExternalLabourPreviewPage() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                setLoading(true);
                const res = await fetchExternalLabourExpenses({ token });
                const data = (res || []);
                const mapped = data.map((row, idx) => ({
                    id: row.id || String(idx),
                    supplier: typeof row.supplier === 'object' && row.supplier !== null
                        ? String(row.supplier.name || '')
                        : String(row.supplier || row.vendor || ''),
                    month: row.month
                        ? new Date(row.month).toLocaleDateString(undefined, {
                            month: 'long',
                            year: 'numeric',
                        })
                        : '',
                    paidAmount: Number(row.paidAmount ?? 0) || 0,
                }));
                setRows(mapped);
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    const viewRows = useMemo(() => rows, [rows]);
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold", children: "Finance / External Labour Expense (Read Only)" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Finance > External Labour Expense Preview" })] }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate('/finance'), children: "Back to Finance" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "External Labour Expense (All)" }) }), _jsx(CardContent, { children: _jsx(Table, { columns: columns, data: viewRows, emptyText: "No external labour expenses" }) })] })] })] }));
}

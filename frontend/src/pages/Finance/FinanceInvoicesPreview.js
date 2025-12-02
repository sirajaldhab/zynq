import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { useNavigate } from 'react-router-dom';
import { fetchInvoices } from '../../api/financeService';
const columns = [
    { key: 'number', header: 'Invoice' },
    { key: 'client', header: 'Client' },
    {
        key: 'date',
        header: 'Date',
        render: (r) => (r.date ? new Date(r.date).toLocaleDateString() : ''),
    },
    {
        key: 'amount',
        header: 'Amount',
        render: (r) => r.amount.toLocaleString(),
    },
    { key: 'status', header: 'Status' },
];
export default function FinanceInvoicesPreviewPage() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                setLoading(true);
                const res = await fetchInvoices({
                    status: 'All',
                    search: '',
                    page: 1,
                    pageSize: 1000,
                    token,
                });
                const data = (res.rows ?? res.data ?? []);
                const mapped = data.map((r) => ({
                    id: r.id,
                    number: r.invoice_no || r.number || r.id,
                    client: r.client?.name || r.clientName || r.client || r.clientId || '',
                    date: (r.invoice_date || r.date || '').slice(0, 10),
                    amount: Number(r.total ?? r.subtotal ?? r.amount ?? 0) || 0,
                    status: r.status || 'Pending',
                }));
                setRows(mapped);
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    const viewRows = useMemo(() => rows, [rows]);
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold", children: "Finance / Invoices (Read Only)" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Finance > Invoices Preview" })] }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate('/finance'), children: "Back to Finance" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Invoices (All)" }) }), _jsx(CardContent, { children: _jsx(Table, { columns: columns, data: viewRows, emptyText: "No invoices" }) })] })] })] }));
}

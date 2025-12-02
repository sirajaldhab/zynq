import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { useNavigate } from 'react-router-dom';
import { fetchGeneralExpenses } from '../../api/financeService';
const columns = [
    { key: 'company', header: 'Company' },
    {
        key: 'date',
        header: 'Date',
        render: (r) => (r.date ? new Date(r.date).toLocaleDateString() : ''),
    },
    { key: 'invNo', header: 'Inv No' },
    { key: 'description', header: 'Description' },
    { key: 'supplier', header: 'Supplier' },
    {
        key: 'totalAmount',
        header: 'Total Amount',
        render: (r) => r.totalAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
    },
];
export default function FinanceGeneralExpensePreviewPage() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                setLoading(true);
                const res = await fetchGeneralExpenses({ page: 1, pageSize: 1000, token });
                const data = (res.rows ?? res.data ?? []);
                const mapped = data.map((e, idx) => {
                    const note = e.note || '';
                    const parts = note.split(';');
                    const get = (key) => {
                        const p = parts.find((s) => s.trim().toLowerCase().startsWith(key));
                        if (!p)
                            return '';
                        return p.split(':').slice(1).join(':').trim();
                    };
                    const invNo = get('inv');
                    const supplier = get('supplier');
                    const company = get('company');
                    const totalAmountNote = get('totalamount');
                    const totalFromNote = totalAmountNote ? Number(totalAmountNote) : undefined;
                    const totalAmount = (Number.isFinite(totalFromNote)
                        ? totalFromNote
                        : Number(e.amount ?? 0) || 0) || 0;
                    return {
                        id: e.id || String(idx),
                        company,
                        date: (e.date || '').slice(0, 10),
                        invNo,
                        description: e.category || e.note || '',
                        supplier,
                        totalAmount,
                    };
                });
                setRows(mapped);
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    const viewRows = useMemo(() => rows, [rows]);
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold", children: "Finance / General Expenses (Read Only)" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Finance > General Expenses Preview" })] }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate('/finance'), children: "Back to Finance" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "General Expenses (All)" }) }), _jsx(CardContent, { children: _jsx(Table, { columns: columns, data: viewRows, emptyText: "No general expenses" }) })] })] })] }));
}

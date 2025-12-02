import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { IonPage, IonContent, useIonToast, IonIcon } from '@ionic/react';
import Nav from '../../components/Nav';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { useQueryParam } from '../../hooks/useQueryParam';
import { fetchProjects } from '../../api/projectsService';
import { getUnifiedExpensesTotal, getInvoicesReceivedTotal } from '../../api/financeService';
import { chevronBackOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
export default function ProfitLoss() {
    const navigate = useNavigate();
    const [present] = useIonToast();
    const [projectId, setProjectId] = useQueryParam('pnlProject', '');
    const [dateFrom, setDateFrom] = useQueryParam('pnlFrom', '');
    const [dateTo, setDateTo] = useQueryParam('pnlTo', '');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalIn, setTotalIn] = useState(0);
    const [totalOut, setTotalOut] = useState(0);
    async function loadTotals() {
        const token = localStorage.getItem('token') || undefined;
        try {
            setLoading(true);
            // Inflows:
            // Use invoices aggregate for Received invoices (status Received/Paid),
            // summing the received amount for the given project/date range.
            const inflowPromise = getInvoicesReceivedTotal({
                projectId: projectId || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                token,
            });
            // Expenses:
            // Use unified expenses aggregate which combines:
            // - Expense & General Expense rows
            // - Company employee salary (SalaryPaid + Loan)
            // - External manpower paid amounts
            const expensePromise = getUnifiedExpensesTotal({
                projectId: projectId || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                token,
            });
            const [inRes, outRes] = await Promise.all([inflowPromise, expensePromise]);
            const inVal = Number(inRes?.totalAmount ?? 0) || 0;
            const outVal = Number(outRes?.totalAmount ?? 0) || 0;
            setTotalIn(Math.round(inVal * 100) / 100);
            setTotalOut(Math.round(outVal * 100) / 100);
        }
        catch (e) {
            console.error('P&L totals load error:', e);
            setTotalIn(0);
            setTotalOut(0);
            const msg = e?.message || '';
            if (/HTTP\s(4|5)\d{2}/.test(msg)) {
                present({ message: 'Failed to load Profit & Loss totals', color: 'danger', duration: 1800, position: 'top' });
            }
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                const ps = await fetchProjects({ page: 1, pageSize: 200, token });
                setProjects(ps.data ?? []);
            }
            catch { }
        })();
    }, []);
    useEffect(() => {
        loadTotals();
    }, [projectId, dateFrom, dateTo]);
    const net = totalIn - totalOut;
    function fmt2(v) {
        return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "text-lg font-semibold hidden lg:block", children: "Finance / Profit & Loss" }), _jsx("div", { className: "zynq-muted text-sm hidden lg:block", children: "Home > Finance > Profit & Loss" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/finance'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Filters" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3 mb-1", children: [_jsxs(Select, { label: "Project", value: projectId, onChange: (e) => setProjectId(e.target.value), children: [_jsx("option", { value: "", children: "All" }), projects.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id)))] }), _jsx(Input, { label: "From", type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value) }), _jsx(Input, { label: "To", type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value) })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Inflows" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-semibold text-[color:var(--success)]", children: loading ? '…' : fmt2(totalIn) }), _jsx("div", { className: "zynq-muted text-sm", children: "Sum of received amounts" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Expenses" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-semibold text-[color:var(--danger)]", children: loading ? '…' : fmt2(totalOut) }), _jsx("div", { className: "zynq-muted text-sm", children: "Sum of expenses" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Net" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: `text-2xl font-semibold ${net < 0
                                                        ? 'text-[color:var(--danger)]'
                                                        : net > 0
                                                            ? 'text-[color:var(--success)]'
                                                            : ''}`, children: loading ? '…' : fmt2(net) }), _jsx("div", { className: "zynq-muted text-sm", children: "Inflows - Expenses" })] })] })] })] }) })] }));
}

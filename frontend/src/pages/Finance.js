import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useState, useEffect } from 'react';
import { IonContent, IonPage, useIonToast, IonButton, IonIcon } from '@ionic/react';
import Nav from '../components/Nav';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Table from '../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { chevronBackOutline } from 'ionicons/icons';
import { toCsv, downloadCsv } from '../utils/csv';
import { useQueryParam } from '../hooks/useQueryParam';
import { fetchInvoices, createInvoice, updateInvoice, deleteInvoice, fetchExpenses, fetchGeneralExpenses, } from '../api/financeService';
import { fetchPayrolls } from '../api/hrService';
import { fetchExternalLabourExpenses } from '../api/externalLabourExpenseService';
const StatusChip = ({ s }) => {
    const map = {
        Paid: 'bg-green-500/10 text-green-500',
        Pending: 'bg-amber-500/10 text-amber-500',
        Overdue: 'bg-red-500/10 text-red-500',
    };
    return _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${map[s]}`, children: s });
};
export default function Finance() {
    const [present] = useIonToast();
    const navigate = useNavigate();
    useEffect(() => {
        console.log('Loaded Finance > Invoices page');
    }, []);
    const [invSearch, setInvSearch] = useQueryParam('invQ', '');
    const [invStatus, setInvStatus] = useQueryParam('invStatus', 'All');
    // For Finance root we show only 5-row previews; pagination will navigate to full pages.
    const [invPage, setInvPage] = useQueryParam('invPage', 1);
    const invPageSize = 5;
    const [payPage, setPayPage] = useQueryParam('payPage', 1);
    const payPageSize = 5;
    const [invoices, setInvoices] = useState([]);
    const [invoicesTotal, setInvoicesTotal] = useState(0);
    const [payments, setPayments] = useState([]);
    const [paymentsTotal, setPaymentsTotal] = useState(0);
    // Top dashboard-style finance summaries sourced from other pages' data
    const [summaryInvoicesTotal, setSummaryInvoicesTotal] = useState(0);
    const [summaryExpenseTotal, setSummaryExpenseTotal] = useState(0);
    const [summaryGeneralExpenseTotal, setSummaryGeneralExpenseTotal] = useState(0);
    const [summarySalaryTotal, setSummarySalaryTotal] = useState(0);
    const [summaryExternalLabourPaid, setSummaryExternalLabourPaid] = useState(0);
    // Preview rows for other Finance pages (5-row snapshots)
    const [generalExpenses, setGeneralExpenses] = useState([]);
    const [salaryPreview, setSalaryPreview] = useState([]);
    const [externalLabourPreview, setExternalLabourPreview] = useState([]);
    const filteredInvoices = useMemo(() => {
        const q = (invSearch || '').toString().toLowerCase();
        return invoices.filter((r) => {
            const clientName = (r.client || '').toString().toLowerCase();
            const invNumber = (r.number || '').toString().toLowerCase();
            return ((invStatus === 'All' || r.status === invStatus) &&
                (clientName.includes(q) || invNumber.includes(q)));
        });
    }, [invoices, invSearch, invStatus]);
    const invoiceTotals = useMemo(() => {
        const list = Array.isArray(filteredInvoices) ? filteredInvoices : [];
        const total = list.reduce((s, r) => s + r.amount, 0);
        const paid = list.filter((r) => r.status === 'Paid').reduce((s, r) => s + r.amount, 0);
        const pending = list.filter((r) => r.status === 'Pending').reduce((s, r) => s + r.amount, 0);
        const overdue = list.filter((r) => r.status === 'Overdue').reduce((s, r) => s + r.amount, 0);
        return { total, paid, pending, overdue };
    }, [filteredInvoices]);
    // Note: payments are now "Expense Invoice" rows with totalAmount, so we no longer compute a direct payments sum here.
    function exportInvoicesCsv() {
        const cols = [
            { key: 'number', header: 'Invoice' },
            { key: 'client', header: 'Client' },
            { key: 'date', header: 'Date', map: (r) => new Date(r.date).toISOString() },
            { key: 'dueDate', header: 'Due', map: (r) => new Date(r.dueDate).toISOString() },
            { key: 'amount', header: 'Amount' },
            { key: 'status', header: 'Status' },
        ];
        downloadCsv('invoices.csv', toCsv(filteredInvoices, cols));
    }
    function exportPaymentsCsv() {
        const cols = [
            { key: 'date', header: 'Date', map: (r) => new Date(r.date).toISOString() },
            { key: 'amount', header: 'Amount' },
            { key: 'method', header: 'Method' },
            { key: 'reference', header: 'Reference' },
        ];
        downloadCsv('payments.csv', toCsv(payments, cols));
    }
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState({
        number: '', client: '', date: new Date().toISOString().slice(0, 10), dueDate: new Date().toISOString().slice(0, 10), amount: 0, status: 'Pending'
    });
    function openCreate() {
        setForm({ number: '', client: '', date: new Date().toISOString().slice(0, 10), dueDate: new Date().toISOString().slice(0, 10), amount: 0, status: 'Pending' });
        setCreating(true);
    }
    function openEdit(inv) {
        setForm({ number: inv.number, client: inv.client, date: inv.date.slice(0, 10), dueDate: inv.dueDate.slice(0, 10), amount: inv.amount, status: inv.status });
        setEditing(inv);
    }
    function openDelete(inv) { setDeleting(inv); }
    async function handleCreate() {
        setBusy(true);
        const token = localStorage.getItem('token') || undefined;
        try {
            // NOTE: Backend requires valid projectId and clientId. Using placeholders for now.
            await createInvoice({ token }, {
                projectId: 'default-project', // TODO: replace with selected project
                clientId: 'default-client', // TODO: replace with selected client
                invoice_no: form.number,
                invoice_date: form.date,
                due_date: form.dueDate,
                items_json: {},
                subtotal: form.amount,
                vat: 0,
                total: form.amount,
                status: form.status,
            });
            present({ message: 'Invoice created', color: 'success', duration: 1500, position: 'top' });
            setCreating(false);
            // refresh list (normalized mapping)
            const res = await fetchInvoices({ status: invStatus, search: invSearch, page: invPage, pageSize: invPageSize, token });
            const data = res.rows ?? res.data ?? [];
            const mapped = data.map((r) => {
                const rawClient = (r.client && typeof r.client === 'object' ? r.client.name : r.client) ??
                    r.clientName ??
                    r.clientId ??
                    '';
                return {
                    id: r.id,
                    number: r.invoice_no || r.number || r.id,
                    client: String(rawClient || ''),
                    date: r.invoice_date || r.date,
                    dueDate: r.due_date || r.dueDate || r.invoice_date || r.date,
                    amount: r.total ?? r.subtotal ?? r.amount ?? 0,
                    status: r.status || 'Pending',
                };
            });
            setInvoices(mapped);
            setInvoicesTotal((res.total || mapped.length) || 0);
        }
        catch (e) {
            present({ message: 'Create failed. Configure project/client first.', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setBusy(false);
        }
    }
    async function handleEdit() {
        if (!editing)
            return;
        setBusy(true);
        const token = localStorage.getItem('token') || undefined;
        try {
            await updateInvoice({ id: editing.id, token }, {
                invoice_date: form.date,
                due_date: form.dueDate,
                items_json: {},
                subtotal: form.amount,
                vat: 0,
                total: form.amount,
                status: form.status,
            });
            present({ message: 'Invoice updated', color: 'success', duration: 1500, position: 'top' });
            setEditing(null);
            const res = await fetchInvoices({ status: invStatus, search: invSearch, page: invPage, pageSize: invPageSize, token });
            const data = res.rows ?? res.data ?? [];
            const mapped = data.map((r) => ({
                id: r.id,
                number: r.invoice_no || r.number || r.id,
                client: r.client?.name || r.clientName || r.client || r.clientId || '',
                date: r.invoice_date || r.date,
                dueDate: r.due_date || r.dueDate || r.invoice_date || r.date,
                amount: r.total ?? r.subtotal ?? r.amount ?? 0,
                status: r.status || 'Pending',
            }));
            setInvoices(mapped);
            setInvoicesTotal((res.total || mapped.length) || 0);
        }
        catch (e) {
            present({ message: 'Update failed', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setBusy(false);
        }
    }
    async function handleDelete() {
        if (!deleting)
            return;
        setBusy(true);
        const token = localStorage.getItem('token') || undefined;
        try {
            await deleteInvoice({ id: deleting.id, token });
            present({ message: 'Invoice deleted', color: 'success', duration: 1500, position: 'top' });
            setDeleting(null);
            const res = await fetchInvoices({ status: invStatus, search: invSearch, page: invPage, pageSize: invPageSize, token });
            const data = res.rows ?? res.data ?? [];
            const mapped = data.map((r) => ({
                id: r.id,
                number: r.invoice_no || r.number || r.id,
                client: r.client?.name || r.clientName || r.client || r.clientId || '',
                date: r.invoice_date || r.date,
                dueDate: r.due_date || r.dueDate || r.invoice_date || r.date,
                amount: r.total ?? r.subtotal ?? r.amount ?? 0,
                status: r.status || 'Pending',
            }));
            setInvoices(mapped);
            setInvoicesTotal((res.total || mapped.length) || 0);
        }
        catch (e) {
            present({ message: 'Delete failed', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setBusy(false);
        }
    }
    const invoicesColumns = [
        { key: 'number', header: 'Invoice' },
        { key: 'client', header: 'Client' },
        { key: 'date', header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
        { key: 'amount', header: 'Amount', render: (r) => r.amount.toLocaleString() },
        { key: 'status', header: 'Status', render: (r) => _jsx(StatusChip, { s: r.status }) },
    ];
    const paymentsColumns = [
        { key: 'company', header: 'Company' },
        { key: 'date', header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
        { key: 'description', header: 'Description' },
        { key: 'supplier', header: 'Supplier' },
        { key: 'totalAmount', header: 'Total Amount', render: (r) => r.totalAmount.toLocaleString() },
    ];
    const viewInvoices = filteredInvoices.slice(0, 5);
    const viewPayments = payments.slice(0, 5);
    const generalColumns = [
        { key: 'company', header: 'Company' },
        { key: 'date', header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
        { key: 'invNo', header: 'Inv No' },
        { key: 'description', header: 'Description' },
        { key: 'supplier', header: 'Supplier' },
        { key: 'totalAmount', header: 'Total Amount', render: (r) => r.totalAmount.toLocaleString() },
    ];
    const salaryColumns = [
        { key: 'company', header: 'Company' },
        { key: 'employeeName', header: 'Employee Name' },
        { key: 'emiratesId', header: 'Emirates ID' },
        { key: 'totalSalary', header: 'Total Salary', render: (r) => r.totalSalary.toLocaleString() },
    ];
    const externalLabourColumns = [
        { key: 'supplier', header: 'Manpower Supplier' },
        { key: 'month', header: 'Month' },
        { key: 'paidAmount', header: 'Paid Amount', render: (r) => r.paidAmount.toLocaleString() },
    ];
    // Load global finance summaries once on mount so cards reflect latest saved data
    useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                // Invoices Total: sum of invoice totals across all invoices (all statuses)
                const invRes = await fetchInvoices({ page: 1, pageSize: 1000, token });
                const invDataRaw = (invRes.rows ?? invRes.data ?? []);
                const invData = Array.isArray(invDataRaw) ? invDataRaw : [];
                const invoicesTotalAmount = invData.reduce((sum, r) => {
                    const amount = r.total ?? r.subtotal ?? r.amount ?? 0;
                    return sum + (Number(amount) || 0);
                }, 0);
                setSummaryInvoicesTotal(invoicesTotalAmount);
            }
            catch (e) {
                console.error('Finance summary invoices load error:', e);
                setSummaryInvoicesTotal(0);
                present({ message: 'Failed to load invoice totals', color: 'danger', duration: 1800, position: 'top' });
            }
            try {
                // Expenses Total = Expense page Total Amount (from Expense.tsx summary.totalAmount)
                const expRes = await fetchExpenses({ page: 1, pageSize: 1000, token });
                const expDataRaw = (expRes.rows ?? expRes.data ?? []);
                const expData = Array.isArray(expDataRaw) ? expDataRaw : [];
                const expenseTotalAmount = expData.reduce((sum, r) => {
                    // Expense page reconstructs totalAmount as amount + vat5 - discount from note/fields.
                    const rawNote = r.note ?? '';
                    const note = typeof rawNote === 'string' ? rawNote : String(rawNote || '');
                    const parts = note.split(';');
                    const getNum = (key) => {
                        const p = parts.find((s) => typeof s === 'string' && s.trim().toLowerCase().startsWith(key));
                        if (!p)
                            return undefined;
                        const v = p.split(':').slice(1).join(':').trim();
                        const n = Number(v);
                        return Number.isFinite(n) ? n : undefined;
                    };
                    const parsedAmount = getNum('amount');
                    const parsedVat = getNum('vat');
                    const parsedDiscount = getNum('discount');
                    const amount = parsedAmount ?? r.amount ?? 0;
                    const vat = parsedVat ?? 0;
                    const discount = parsedDiscount ?? 0;
                    const totalAmount = amount + vat - discount;
                    return sum + (Number(totalAmount) || 0);
                }, 0);
                setSummaryExpenseTotal(expenseTotalAmount);
            }
            catch (e) {
                console.error('Finance summary expense load error:', e);
                setSummaryExpenseTotal(0);
                present({ message: 'Failed to load expense totals', color: 'danger', duration: 1800, position: 'top' });
            }
            try {
                // General Expenses Total = GeneralExpense page Total Amount (summaryTotal)
                const genRes = await fetchGeneralExpenses({ page: 1, pageSize: 1000, token });
                const genDataRaw = (genRes.rows ?? genRes.data ?? []);
                const genData = Array.isArray(genDataRaw) ? genDataRaw : [];
                const generalTotalAmount = genData.reduce((sum, r) => {
                    const rawNote = r.note ?? '';
                    const note = typeof rawNote === 'string' ? rawNote : String(rawNote || '');
                    const parts = note.split(';');
                    const p = parts.find((s) => typeof s === 'string' && s.trim().toLowerCase().startsWith('totalamount'));
                    let value;
                    if (p) {
                        const v = p.split(':').slice(1).join(':').trim();
                        const n = Number(v);
                        if (Number.isFinite(n))
                            value = n;
                    }
                    const totalAmount = value ?? r.amount ?? 0;
                    return sum + (Number(totalAmount) || 0);
                }, 0);
                setSummaryGeneralExpenseTotal(generalTotalAmount);
                // Also cache 5-row preview for General Expenses table
                const mappedPreview = genData.slice(0, 5).map((e, idx) => {
                    const rawNote = e.note ?? '';
                    const note = typeof rawNote === 'string' ? rawNote : String(rawNote || '');
                    const parts = note.split(';');
                    const get = (key) => {
                        const p2 = parts.find((s) => typeof s === 'string' && s.trim().toLowerCase().startsWith(key));
                        if (!p2)
                            return '';
                        return p2.split(':').slice(1).join(':').trim();
                    };
                    const company = String(get('company') || '');
                    const invNo = String(get('inv') || '');
                    const supplier = String(get('supplier') || '');
                    const totalFromNote = get('totalamount');
                    const total = totalFromNote ? Number(totalFromNote) : undefined;
                    const totalAmount = (Number.isFinite(total) ? total : (Number(e.amount ?? 0) || 0));
                    return {
                        id: String(e.id || idx),
                        company,
                        date: (e.date || '').slice(0, 10),
                        invNo,
                        description: String(e.category || e.note || ''),
                        supplier,
                        totalAmount,
                    };
                });
                setGeneralExpenses(mappedPreview);
            }
            catch (e) {
                console.error('Finance summary general expense load error:', e);
                setSummaryGeneralExpenseTotal(0);
                setGeneralExpenses([]);
                present({ message: 'Failed to load general expenses', color: 'danger', duration: 1800, position: 'top' });
            }
            try {
                // Total Salary (All Employees) = same logic as CompanyEmployeeSalaryExpense totalAllEmployees
                const payRes = await fetchPayrolls({ page: 1, pageSize: 1000, token });
                const payrolls = Array.isArray(payRes.data) ? payRes.data : [];
                let salaryTotal = 0;
                const salaryPreviewRows = [];
                for (const p of payrolls) {
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
                    if (extras.salaryPaid === undefined || extras.loan === undefined)
                        continue;
                    const totalForRow = salaryPaid + loan;
                    salaryTotal += totalForRow;
                    // Build a lightweight preview row if employee info is joined
                    const emp = p.employee || {};
                    if (salaryPreviewRows.length < 5) {
                        salaryPreviewRows.push({
                            id: String(p.id),
                            company: String(emp.company || ''),
                            employeeName: String(emp.employeeName || ''),
                            emiratesId: String(emp.emiratesId || ''),
                            totalSalary: totalForRow,
                        });
                    }
                }
                setSummarySalaryTotal(salaryTotal);
                setSalaryPreview(salaryPreviewRows);
            }
            catch (e) {
                console.error('Finance summary salary load error:', e);
                setSummarySalaryTotal(0);
                setSalaryPreview([]);
                present({ message: 'Failed to load salary totals', color: 'danger', duration: 1800, position: 'top' });
            }
            try {
                // External Labour Paid Amount = ExternalLabourExpense page Paid Amount summary (totalPaid)
                const extRes = await fetchExternalLabourExpenses({ token });
                const extData = Array.isArray(extRes) ? extRes : [];
                const totalPaid = extData.reduce((sum, r) => sum + (Number(r.paidAmount) || 0), 0);
                setSummaryExternalLabourPaid(totalPaid);
                const extPreview = extData
                    .slice()
                    .sort((a, b) => {
                    const da = a.month ? new Date(a.month).getTime() : 0;
                    const db = b.month ? new Date(b.month).getTime() : 0;
                    // Newest month first
                    return db - da;
                })
                    .slice(0, 5)
                    .map((row, idx) => ({
                    id: String(row.id || idx),
                    supplier: 
                    // Prefer embedded vendor object name if present
                    (row.vendor && typeof row.vendor === 'object' && row.vendor !== null
                        ? String(row.vendor.name || '')
                        : // Fallback to supplier object name if API uses `supplier`
                            row.supplier && typeof row.supplier === 'object' && row.supplier !== null
                                ? String(row.supplier.name || '')
                                : // Finally, fallback to primitive vendor/supplier ids or names
                                    String(row.vendor || row.supplier || '')),
                    month: row.month
                        ? new Date(row.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                        : '',
                    paidAmount: Number(row.paidAmount ?? 0) || 0,
                }));
                setExternalLabourPreview(extPreview);
            }
            catch (e) {
                console.error('Finance summary external labour load error:', e);
                setSummaryExternalLabourPaid(0);
                setExternalLabourPreview([]);
                present({ message: 'Failed to load external labour totals', color: 'danger', duration: 1800, position: 'top' });
            }
        })();
    }, [present]);
    React.useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            try {
                const res = await fetchInvoices({ status: invStatus, search: invSearch, page: invPage, pageSize: invPageSize, token });
                const dataRaw = res.rows ?? res.data ?? [];
                const data = Array.isArray(dataRaw) ? dataRaw : [];
                const mapped = data.map((r) => {
                    const rawClient = (r.client && typeof r.client === 'object' ? r.client.name : r.client) ??
                        r.clientName ??
                        r.clientId ??
                        '';
                    return {
                        id: r.id,
                        // Prefer explicit invoice_no, then number, then fallback to id
                        number: r.invoice_no || r.number || r.id,
                        // Always a string for table rendering
                        client: String(rawClient || ''),
                        // Use invoice_date if present, else generic date, as ISO string
                        date: (r.invoice_date || r.date || '').slice(0, 10),
                        // Prefer due date field, fall back to invoice date
                        dueDate: (r.due_date || r.dueDate || r.invoice_date || r.date || '').slice(0, 10),
                        // Total amount shown on invoices page
                        amount: Number(r.total ?? r.subtotal ?? r.amount ?? 0) || 0,
                        status: r.status || 'Pending',
                    };
                });
                setInvoices(mapped);
                setInvoicesTotal(res.total || mapped.length || 0);
            }
            catch (e) {
                console.error('Finance landing invoices load error:', e);
                setInvoices([]);
                setInvoicesTotal(0);
                const msg = e?.message || '';
                if (/HTTP\s(4|5)\d{2}/.test(msg)) {
                    present({ message: 'Failed to load invoices.', color: 'danger', duration: 1800, position: 'top' });
                }
            }
        })();
    }, [invStatus, invSearch, invPage]);
    React.useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            try {
                // Reuse Expense page data to show a compact Expense Invoice list here
                const res = await fetchExpenses({ page: payPage, pageSize: payPageSize, token });
                const dataRaw = res.rows ?? res.data ?? [];
                const data = Array.isArray(dataRaw) ? dataRaw : [];
                const mapped = data.map((e, idx) => {
                    const rawNote = e.note ?? '';
                    const note = typeof rawNote === 'string' ? rawNote : String(rawNote || '');
                    const parts = note.split(';');
                    const get = (key) => {
                        const p = parts.find((s) => typeof s === 'string' && s.trim().toLowerCase().startsWith(key));
                        if (!p)
                            return '';
                        return p.split(':').slice(1).join(':').trim();
                    };
                    const company = String(get('company') || '');
                    const supplier = String(get('supplier') || '');
                    const description = String(e.category || e.note || '');
                    const amount = Number(e.amount ?? 0) || 0;
                    const amtNote = get('amount');
                    const vatNote = get('vat');
                    const discNote = get('discount');
                    const parsedAmount = amtNote ? Number(amtNote) : undefined;
                    const parsedVat = vatNote ? Number(vatNote) : undefined;
                    const parsedDiscount = discNote ? Number(discNote) : undefined;
                    const baseAmount = parsedAmount ?? amount;
                    const vat = parsedVat ?? 0;
                    const discount = parsedDiscount ?? 0;
                    const totalAmount = baseAmount + vat - discount;
                    return {
                        id: String(e.id || idx),
                        company,
                        date: (e.date || '').slice(0, 10),
                        description,
                        supplier,
                        totalAmount,
                    };
                });
                setPayments(mapped);
                setPaymentsTotal((res.total ?? mapped.length) || 0);
            }
            catch (e) {
                console.error('Finance landing expense-invoice load error:', e);
                setPayments([]);
                setPaymentsTotal(0);
                const msg = e?.message || '';
                if (/HTTP\s(4|5)\d{2}/.test(msg)) {
                    present({ message: 'Failed to load expense invoices.', color: 'danger', duration: 1800, position: 'top' });
                }
            }
        })();
    }, [payPage, payPageSize, present]);
    function resetInvoiceFilters() {
        setInvSearch('');
        setInvStatus('All');
        setInvPage(1);
    }
    function resetPaymentFilters() {
        setPayPage(1);
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "px-4 py-6 sm:px-6 lg:px-8 bg-[color:var(--bg)] space-y-6", children: [_jsxs("div", { className: "mx-auto w-full max-w-screen-md lg:max-w-none space-y-6", children: [_jsx("div", { className: "text-lg font-semibold hidden lg:block", children: "Finance" }), _jsx("div", { className: "zynq-muted text-sm hidden lg:block", children: "Home > Finance > Invoices" }), _jsx("div", { className: "hidden lg:block", children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-2", children: [_jsx(IonButton, { size: "small", color: "medium", routerLink: "/finance/invoices", children: "Invoices" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/finance/expenses", children: "Expenses" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/finance/profit-loss", children: "Profit & Loss" })] }), _jsx("div", { className: "px-2 sm:px-0", children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "Invoices Total" }), _jsx(CardContent, { className: "text-2xl font-semibold text-[color:var(--success)]", children: summaryInvoicesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "Expenses Total" }), _jsx(CardContent, { className: "text-2xl font-semibold text-[color:var(--danger)]", children: summaryExpenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "General Expenses Total" }), _jsx(CardContent, { className: "text-2xl font-semibold text-[color:var(--danger)]", children: summaryGeneralExpenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "Total Salary (All Employees)" }), _jsx(CardContent, { className: "text-2xl font-semibold text-[color:var(--danger)]", children: summarySalaryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "External Labour Paid Amount" }), _jsx(CardContent, { className: "text-2xl font-semibold text-[color:var(--danger)]", children: summaryExternalLabourPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Invoices" }), _jsx("div", { className: "flex gap-2" })] }), _jsxs(CardContent, { children: [_jsx(Table, { columns: invoicesColumns, data: Array.isArray(viewInvoices) ? viewInvoices : [], emptyText: "No invoices" }), _jsx("div", { className: "mt-2 flex justify-end", children: _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate('/finance/invoices'), children: "View all invoices" }) })] })] }), creating || editing ? (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-[color:var(--surface)] zynq-border border rounded-md p-4 w-[min(520px,95vw)] space-y-3", children: [_jsx("div", { className: "text-base font-semibold", children: creating ? 'Add Invoice' : 'Edit Invoice' }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsx(Input, { label: "Invoice No.", value: form.number, onChange: (e) => setForm({ ...form, number: e.target.value }) }), _jsx(Input, { label: "Client", value: form.client, onChange: (e) => setForm({ ...form, client: e.target.value }) }), _jsx(Input, { label: "Date", type: "date", value: form.date, onChange: (e) => setForm({ ...form, date: e.target.value }) }), _jsx(Input, { label: "Due Date", type: "date", value: form.dueDate, onChange: (e) => setForm({ ...form, dueDate: e.target.value }) }), _jsx(Input, { label: "Amount", type: "number", value: String(form.amount), onChange: (e) => setForm({ ...form, amount: Number(e.target.value) || 0 }) }), _jsxs(Select, { label: "Status", value: form.status, onChange: (e) => setForm({ ...form, status: e.target.value }), children: [_jsx("option", { value: "Paid", children: "Paid" }), _jsx("option", { value: "Pending", children: "Pending" }), _jsx("option", { value: "Overdue", children: "Overdue" })] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: () => { setCreating(false); setEditing(null); }, disabled: busy, children: "Cancel" }), creating ? (_jsx(Button, { onClick: handleCreate, disabled: busy, children: "Create" })) : (_jsx(Button, { onClick: handleEdit, disabled: busy, children: "Save" }))] }), _jsx("div", { className: "text-xs zynq-muted" })] }) })) : null, deleting ? (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-[color:var(--surface)] zynq-border border rounded-md p-4 w-[min(420px,95vw)] space-y-3", children: [_jsx("div", { className: "text-base font-semibold", children: "Delete Invoice" }), _jsxs("div", { className: "text-sm", children: ["Are you sure you want to delete invoice ", _jsx("span", { className: "font-medium", children: deleting.number }), "?"] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setDeleting(null), disabled: busy, children: "Cancel" }), _jsx(Button, { variant: "danger", onClick: handleDelete, disabled: busy, children: "Delete" })] })] }) })) : null, _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Expense Invoice" }), _jsx("div", { className: "flex gap-2", children: _jsx(Button, { variant: "secondary", size: "sm", onClick: resetPaymentFilters, children: "Reset" }) })] }), _jsxs(CardContent, { children: [_jsx(Table, { columns: paymentsColumns, data: Array.isArray(viewPayments) ? viewPayments : [], emptyText: "No expense invoices" }), _jsx("div", { className: "mt-2 flex justify-end", children: _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate('/finance/expenses/expense'), children: "View all expense invoices" }) })] })] }), _jsxs(Card, { className: "mt-6", children: [_jsx(CardHeader, { className: "flex items-center justify-between", children: _jsx(CardTitle, { children: "General Expenses" }) }), _jsxs(CardContent, { children: [_jsx(Table, { columns: generalColumns, data: Array.isArray(generalExpenses) ? generalExpenses.slice(0, 5) : [], emptyText: "No general expenses" }), _jsx("div", { className: "mt-2 flex justify-end", children: _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate('/finance/expenses/general'), children: "View all general expenses" }) })] })] }), _jsxs(Card, { className: "mt-6", children: [_jsx(CardHeader, { className: "flex items-center justify-between", children: _jsx(CardTitle, { children: "Company Employee Salary" }) }), _jsxs(CardContent, { children: [_jsx(Table, { columns: salaryColumns, data: Array.isArray(salaryPreview) ? salaryPreview.slice(0, 5) : [], emptyText: "No salary expenses" }), _jsx("div", { className: "mt-2 flex justify-end", children: _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate('/finance/expenses/company-employee-salary'), children: "View all company employee salary" }) })] })] }), _jsxs(Card, { className: "mt-6", children: [_jsx(CardHeader, { className: "flex items-center justify-between", children: _jsx(CardTitle, { children: "External Labour Expense" }) }), _jsxs(CardContent, { children: [_jsx(Table, { columns: externalLabourColumns, data: Array.isArray(externalLabourPreview) ? externalLabourPreview.slice(0, 5) : [], emptyText: "No external labour expenses" }), _jsx("div", { className: "mt-2 flex justify-end", children: _jsx(Button, { variant: "secondary", size: "sm", onClick: () => navigate('/finance/expenses/manpower/external-labour-expense'), children: "View all external labour expense" }) })] })] })] })] }));
}

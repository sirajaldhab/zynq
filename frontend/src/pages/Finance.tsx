import React, { useMemo, useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonToast, IonButton, IonIcon } from '@ionic/react';
import Nav from '../components/Nav';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Table, { Column } from '../ui/Table';
import Pagination from '../ui/Pagination';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { chevronBackOutline } from 'ionicons/icons';
import { toCsv, downloadCsv, CsvColumn } from '../utils/csv';
import { useQueryParam } from '../hooks/useQueryParam';
import {
  fetchInvoices,
  fetchPayments,
  InvoiceDto,
  PaymentDto,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  fetchExpenses,
  fetchGeneralExpenses,
} from '../api/financeService';
import { fetchPayrolls } from '../api/hrService';
import { fetchExternalLabourExpenses } from '../api/externalLabourExpenseService';

type Invoice = {
  id: string;
  number: string;
  client: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
};

type Payment = {
  id: string;
  company: string;
  date: string;
  description: string;
  supplier: string;
  totalAmount: number;
};

type GeneralExpenseRow = {
  id: string;
  company: string;
  date: string;
  invNo: string;
  description: string;
  supplier: string;
  totalAmount: number;
};

type SalaryPreviewRow = {
  id: string;
  company: string;
  employeeName: string;
  emiratesId: string;
  totalSalary: number;
};

type ExternalLabourPreviewRow = {
  id: string;
  supplier: string;
  month: string;
  paidAmount: number;
};

const StatusChip = ({ s }: { s: Invoice['status'] }) => {
  const map: Record<Invoice['status'], string> = {
    Paid: 'bg-green-500/10 text-green-500',
    Pending: 'bg-amber-500/10 text-amber-500',
    Overdue: 'bg-red-500/10 text-red-500',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs ${map[s]}`}>{s}</span>;
};

export default function Finance() {
  const [present] = useIonToast();
  const navigate = useNavigate();
  useEffect(() => {
    console.log('Loaded Finance > Invoices page');
  }, []);
  const [invSearch, setInvSearch] = useQueryParam<string>('invQ', '');
  const [invStatus, setInvStatus] = useQueryParam<'All' | Invoice['status']>('invStatus', 'All');
  // For Finance root we show only 5-row previews; pagination will navigate to full pages.
  const [invPage, setInvPage] = useQueryParam<number>('invPage', 1);
  const invPageSize = 5;

  const [payPage, setPayPage] = useQueryParam<number>('payPage', 1);
  const payPageSize = 5;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesTotal, setInvoicesTotal] = useState<number>(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState<number>(0);

  // Top dashboard-style finance summaries sourced from other pages' data
  const [summaryInvoicesTotal, setSummaryInvoicesTotal] = useState<number>(0);
  const [summaryExpenseTotal, setSummaryExpenseTotal] = useState<number>(0);
  const [summaryGeneralExpenseTotal, setSummaryGeneralExpenseTotal] = useState<number>(0);
  const [summarySalaryTotal, setSummarySalaryTotal] = useState<number>(0);
  const [summaryExternalLabourPaid, setSummaryExternalLabourPaid] = useState<number>(0);

  // Preview rows for other Finance pages (5-row snapshots)
  const [generalExpenses, setGeneralExpenses] = useState<GeneralExpenseRow[]>([]);
  const [salaryPreview, setSalaryPreview] = useState<SalaryPreviewRow[]>([]);
  const [externalLabourPreview, setExternalLabourPreview] = useState<ExternalLabourPreviewRow[]>([]);

  const filteredInvoices = useMemo(() => {
    const q = (invSearch || '').toString().toLowerCase();
    return invoices.filter((r) => {
      const clientName = (r.client || '').toString().toLowerCase();
      const invNumber = (r.number || '').toString().toLowerCase();
      return (
        (invStatus === 'All' || r.status === invStatus) &&
        (clientName.includes(q) || invNumber.includes(q))
      );
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
    const cols: CsvColumn<Invoice>[] = [
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
    const cols: CsvColumn<Payment>[] = [
      { key: 'date', header: 'Date', map: (r) => new Date(r.date).toISOString() },
      { key: 'amount', header: 'Amount' },
      { key: 'method', header: 'Method' },
      { key: 'reference', header: 'Reference' },
    ];
    downloadCsv('payments.csv', toCsv(payments, cols));
  }

  const [editing, setEditing] = useState<Invoice | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const [form, setForm] = useState<{ number: string; client: string; date: string; dueDate: string; amount: number; status: Invoice['status']; }>({
    number: '', client: '', date: new Date().toISOString().slice(0,10), dueDate: new Date().toISOString().slice(0,10), amount: 0, status: 'Pending'
  });

  function openCreate() {
    setForm({ number: '', client: '', date: new Date().toISOString().slice(0,10), dueDate: new Date().toISOString().slice(0,10), amount: 0, status: 'Pending' });
    setCreating(true);
  }
  function openEdit(inv: Invoice) {
    setForm({ number: inv.number, client: inv.client, date: inv.date.slice(0,10), dueDate: inv.dueDate.slice(0,10), amount: inv.amount, status: inv.status });
    setEditing(inv);
  }
  function openDelete(inv: Invoice) { setDeleting(inv); }

  async function handleCreate() {
    setBusy(true);
    const token = localStorage.getItem('token') || undefined;
    try {
      // NOTE: Backend requires valid projectId and clientId. Using placeholders for now.
      await createInvoice(
        { token },
        {
          projectId: 'default-project', // TODO: replace with selected project
          clientId: 'default-client',   // TODO: replace with selected client
          invoice_no: form.number,
          invoice_date: form.date,
          due_date: form.dueDate,
          items_json: {},
          subtotal: form.amount,
          vat: 0,
          total: form.amount,
          status: form.status,
        },
      );
      present({ message: 'Invoice created', color: 'success', duration: 1500, position: 'top' });
      setCreating(false);
      // refresh list (normalized mapping)
      const res = await fetchInvoices({ status: invStatus as any, search: invSearch, page: invPage, pageSize: invPageSize, token } as any);
      const data = (res as any).rows ?? (res as any).data ?? [];
      const mapped: Invoice[] = data.map((r: any) => {
        const rawClient =
          (r.client && typeof r.client === 'object' ? (r.client as any).name : r.client) ??
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
          status: (r.status as any) || 'Pending',
        };
      });
      setInvoices(mapped);
      setInvoicesTotal(((res as any).total || mapped.length) || 0);
    } catch (e: any) {
      present({ message: 'Create failed. Configure project/client first.', color: 'danger', duration: 2000, position: 'top' });
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit() {
    if (!editing) return;
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
      const res = await fetchInvoices({ status: invStatus as any, search: invSearch, page: invPage, pageSize: invPageSize, token } as any);
      const data = (res as any).rows ?? (res as any).data ?? [];
      const mapped: Invoice[] = data.map((r: any) => ({
        id: r.id,
        number: r.invoice_no || r.number || r.id,
        client: r.client?.name || r.clientName || r.client || r.clientId || '',
        date: r.invoice_date || r.date,
        dueDate: r.due_date || r.dueDate || r.invoice_date || r.date,
        amount: r.total ?? r.subtotal ?? r.amount ?? 0,
        status: (r.status as any) || 'Pending',
      }));
      setInvoices(mapped);
      setInvoicesTotal(((res as any).total || mapped.length) || 0);
    } catch (e: any) {
      present({ message: 'Update failed', color: 'danger', duration: 2000, position: 'top' });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    const token = localStorage.getItem('token') || undefined;
    try {
      await deleteInvoice({ id: deleting.id, token });
      present({ message: 'Invoice deleted', color: 'success', duration: 1500, position: 'top' });
      setDeleting(null);
      const res = await fetchInvoices({ status: invStatus as any, search: invSearch, page: invPage, pageSize: invPageSize, token } as any);
      const data = (res as any).rows ?? (res as any).data ?? [];
      const mapped: Invoice[] = data.map((r: any) => ({
        id: r.id,
        number: r.invoice_no || r.number || r.id,
        client: r.client?.name || r.clientName || r.client || r.clientId || '',
        date: r.invoice_date || r.date,
        dueDate: r.due_date || r.dueDate || r.invoice_date || r.date,
        amount: r.total ?? r.subtotal ?? r.amount ?? 0,
        status: (r.status as any) || 'Pending',
      }));
      setInvoices(mapped);
      setInvoicesTotal(((res as any).total || mapped.length) || 0);
    } catch (e: any) {
      present({ message: 'Delete failed', color: 'danger', duration: 2000, position: 'top' });
    } finally {
      setBusy(false);
    }
  }

  const invoicesColumns: Column<Invoice>[] = [
    { key: 'number', header: 'Invoice' },
    { key: 'client', header: 'Client' },
    { key: 'date', header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { key: 'amount', header: 'Amount', render: (r) => r.amount.toLocaleString() },
    { key: 'status', header: 'Status', render: (r) => <StatusChip s={r.status} /> },
  ];

  const paymentsColumns: Column<Payment>[] = [
    { key: 'company', header: 'Company' },
    { key: 'date', header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { key: 'description', header: 'Description' },
    { key: 'supplier', header: 'Supplier' },
    { key: 'totalAmount', header: 'Total Amount', render: (r) => r.totalAmount.toLocaleString() },
  ];

  const viewInvoices = filteredInvoices.slice(0, 5);
  const viewPayments = payments.slice(0, 5);

  const generalColumns: Column<GeneralExpenseRow>[] = [
    { key: 'company', header: 'Company' },
    { key: 'date', header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { key: 'invNo', header: 'Inv No' },
    { key: 'description', header: 'Description' },
    { key: 'supplier', header: 'Supplier' },
    { key: 'totalAmount', header: 'Total Amount', render: (r) => r.totalAmount.toLocaleString() },
  ];

  const salaryColumns: Column<SalaryPreviewRow>[] = [
    { key: 'company', header: 'Company' },
    { key: 'employeeName', header: 'Employee Name' },
    { key: 'emiratesId', header: 'Emirates ID' },
    { key: 'totalSalary', header: 'Total Salary', render: (r) => r.totalSalary.toLocaleString() },
  ];

  const externalLabourColumns: Column<ExternalLabourPreviewRow>[] = [
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
        const invRes = await fetchInvoices({ page: 1, pageSize: 1000, token } as any);
        const invDataRaw = ((invRes as any).rows ?? (invRes as any).data ?? []) as any[];
        const invData = Array.isArray(invDataRaw) ? invDataRaw : [];
        const invoicesTotalAmount = invData.reduce((sum, r) => {
          const amount = r.total ?? r.subtotal ?? r.amount ?? 0;
          return sum + (Number(amount) || 0);
        }, 0);
        setSummaryInvoicesTotal(invoicesTotalAmount);
      } catch (e) {
        console.error('Finance summary invoices load error:', e);
        setSummaryInvoicesTotal(0);
      }

      try {
        // Expenses Total = Expense page Total Amount (from Expense.tsx summary.totalAmount)
        const expRes = await fetchExpenses({ page: 1, pageSize: 1000, token } as any);
        const expDataRaw = ((expRes as any).rows ?? (expRes as any).data ?? []) as any[];
        const expData = Array.isArray(expDataRaw) ? expDataRaw : [];
        const expenseTotalAmount = expData.reduce((sum, r) => {
          // Expense page reconstructs totalAmount as amount + vat5 - discount from note/fields.
          const rawNote = r.note ?? '';
          const note = typeof rawNote === 'string' ? rawNote : String(rawNote || '');
          const parts = note.split(';');
          const getNum = (key: string) => {
            const p = parts.find((s: string) => typeof s === 'string' && s.trim().toLowerCase().startsWith(key));
            if (!p) return undefined;
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
      } catch (e) {
        console.error('Finance summary expense load error:', e);
        setSummaryExpenseTotal(0);
      }

      try {
        // General Expenses Total = GeneralExpense page Total Amount (summaryTotal)
        const genRes = await fetchGeneralExpenses({ page: 1, pageSize: 1000, token } as any);
        const genDataRaw = ((genRes as any).rows ?? (genRes as any).data ?? []) as any[];
        const genData = Array.isArray(genDataRaw) ? genDataRaw : [];
        const generalTotalAmount = genData.reduce((sum, r) => {
          const rawNote = r.note ?? '';
          const note = typeof rawNote === 'string' ? rawNote : String(rawNote || '');
          const parts = note.split(';');
          const p = parts.find((s: string) => typeof s === 'string' && s.trim().toLowerCase().startsWith('totalamount'));
          let value: number | undefined;
          if (p) {
            const v = p.split(':').slice(1).join(':').trim();
            const n = Number(v);
            if (Number.isFinite(n)) value = n;
          }
          const totalAmount = value ?? r.amount ?? 0;
          return sum + (Number(totalAmount) || 0);
        }, 0);
        setSummaryGeneralExpenseTotal(generalTotalAmount);

        // Also cache 5-row preview for General Expenses table
        const mappedPreview: GeneralExpenseRow[] = genData.slice(0, 5).map((e: any, idx: number) => {
          const rawNote = e.note ?? '';
          const note = typeof rawNote === 'string' ? rawNote : String(rawNote || '');
          const parts = note.split(';');
          const get = (key: string) => {
            const p2 = parts.find((s: string) => typeof s === 'string' && s.trim().toLowerCase().startsWith(key));
            if (!p2) return '';
            return p2.split(':').slice(1).join(':').trim();
          };
          const company = String(get('company') || '');
          const invNo = String(get('inv') || '');
          const supplier = String(get('supplier') || '');
          const totalFromNote = get('totalamount');
          const total = totalFromNote ? Number(totalFromNote) : undefined;
          const totalAmount = (Number.isFinite(total as any) ? (total as number) : (Number(e.amount ?? 0) || 0));
          return {
            id: String(e.id || idx),
            company,
            date: (e.date || '').slice(0, 10),
            invNo,
            description: String(e.category || e.note || ''),
            supplier,
            totalAmount,
          } as GeneralExpenseRow;
        });
        setGeneralExpenses(mappedPreview);
      } catch (e) {
        console.error('Finance summary general expense load error:', e);
        setSummaryGeneralExpenseTotal(0);
        setGeneralExpenses([]);
      }

      try {
        // Total Salary (All Employees) = same logic as CompanyEmployeeSalaryExpense totalAllEmployees
        const payRes = await fetchPayrolls({ page: 1, pageSize: 1000, token } as any);
        const payrolls = Array.isArray((payRes as any).data) ? ((payRes as any).data as any[]) : [];
        let salaryTotal = 0;
        const salaryPreviewRows: SalaryPreviewRow[] = [];
        for (const p of payrolls) {
          let extras: any = p.deductions_json ?? {};
          if (typeof extras === 'string') {
            try {
              extras = JSON.parse(extras);
            } catch {
              extras = {};
            }
          }
          const salaryPaid = typeof extras.salaryPaid === 'number' && !Number.isNaN(extras.salaryPaid)
            ? extras.salaryPaid
            : 0;
          const loan = typeof extras.loan === 'number' && !Number.isNaN(extras.loan)
            ? extras.loan
            : 0;
          if (extras.salaryPaid === undefined || extras.loan === undefined) continue;

          const totalForRow = salaryPaid + loan;
          salaryTotal += totalForRow;

          // Build a lightweight preview row if employee info is joined
          const emp = (p as any).employee || {};
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
      } catch (e) {
        console.error('Finance summary salary load error:', e);
        setSummarySalaryTotal(0);
        setSalaryPreview([]);
      }

      try {
        // External Labour Paid Amount = ExternalLabourExpense page Paid Amount summary (totalPaid)
        const extRes = await fetchExternalLabourExpenses({ token } as any);
        const extData = Array.isArray(extRes) ? (extRes as any[]) : [];
        const totalPaid = extData.reduce((sum, r) => sum + (Number(r.paidAmount) || 0), 0);
        setSummaryExternalLabourPaid(totalPaid);

        const extPreview: ExternalLabourPreviewRow[] = extData
          .slice()
          .sort((a: any, b: any) => {
            const da = a.month ? new Date(a.month as any).getTime() : 0;
            const db = b.month ? new Date(b.month as any).getTime() : 0;
            // Newest month first
            return db - da;
          })
          .slice(0, 5)
          .map((row: any, idx: number) => ({
            id: String(row.id || idx),
            supplier:
              // Prefer embedded vendor object name if present
              (row.vendor && typeof row.vendor === 'object' && row.vendor !== null
                ? String((row.vendor as any).name || '')
                : // Fallback to supplier object name if API uses `supplier`
                row.supplier && typeof row.supplier === 'object' && row.supplier !== null
                ? String((row.supplier as any).name || '')
                : // Finally, fallback to primitive vendor/supplier ids or names
                  String(row.vendor || row.supplier || '')),
            month: row.month
              ? new Date(row.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
              : '',
            paidAmount: Number(row.paidAmount ?? 0) || 0,
          }));
        setExternalLabourPreview(extPreview);
      } catch (e) {
        console.error('Finance summary external labour load error:', e);
        setSummaryExternalLabourPaid(0);
        setExternalLabourPreview([]);
      }
    })();
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    (async () => {
      try {
        const res = await fetchInvoices({ status: invStatus, search: invSearch, page: invPage, pageSize: invPageSize, token } as any);
        const dataRaw = (res as any).rows ?? (res as any).data ?? [];
        const data = Array.isArray(dataRaw) ? dataRaw : [];
        const mapped: Invoice[] = data.map((r: any) => {
          const rawClient =
            (r.client && typeof r.client === 'object' ? (r.client as any).name : r.client) ??
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
            status: (r.status as any) || 'Pending',
          };
        });
        setInvoices(mapped);
        setInvoicesTotal((res as any).total || mapped.length || 0);
      } catch (e: any) {
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
        const res = await fetchExpenses({ page: payPage as any, pageSize: payPageSize as any, token } as any);
        const dataRaw = (res as any).rows ?? (res as any).data ?? [];
        const data = Array.isArray(dataRaw) ? dataRaw : [];
        const mapped: Payment[] = data.map((e: any, idx: number) => {
          const rawNote = e.note ?? '';
          const note = typeof rawNote === 'string' ? rawNote : String(rawNote || '');
          const parts = note.split(';');
          const get = (key: string) => {
            const p = parts.find((s: string) => typeof s === 'string' && s.trim().toLowerCase().startsWith(key));
            if (!p) return '';
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
          } as Payment;
        });
        setPayments(mapped);
        setPaymentsTotal(((res as any).total ?? mapped.length) || 0);
      } catch (e: any) {
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

  return (
    <IonPage>
      <Nav />
      <IonContent className="px-4 py-6 sm:px-6 lg:px-8 bg-[color:var(--bg)] space-y-6">
        <div className="mx-auto w-full max-w-screen-md lg:max-w-none space-y-6">
          <div className="text-lg font-semibold hidden lg:block">Finance</div>
          <div className="zynq-muted text-sm hidden lg:block">Home &gt; Finance &gt; Invoices</div>
          <div className="hidden lg:block">
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 flex items-center gap-2"
              onClick={() => navigate('/')}
            >
              <IonIcon icon={chevronBackOutline} />
              <span>Back</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <IonButton size="small" color="medium" routerLink="/finance/invoices">Invoices</IonButton>
            <IonButton size="small" color="medium" routerLink="/finance/expenses">Expenses</IonButton>
            {/* Budgets button intentionally hidden on this page */}
            <IonButton size="small" color="medium" routerLink="/finance/profit-loss">Profit & Loss</IonButton>
          </div>
          {/* Totals summary (bound to live values from other Finance pages) */}
          <div className="px-2 sm:px-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <Card>
            <CardHeader className="text-sm zynq-muted">Invoices Total</CardHeader>
            <CardContent className="text-2xl font-semibold text-[color:var(--success)]">
              {summaryInvoicesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-sm zynq-muted">Expenses Total</CardHeader>
            <CardContent className="text-2xl font-semibold text-[color:var(--danger)]">
              {summaryExpenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-sm zynq-muted">General Expenses Total</CardHeader>
            <CardContent className="text-2xl font-semibold text-[color:var(--danger)]">
              {summaryGeneralExpenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-sm zynq-muted">Total Salary (All Employees)</CardHeader>
            <CardContent className="text-2xl font-semibold text-[color:var(--danger)]">
              {summarySalaryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardContent>
          </Card>
              <Card>
                <CardHeader className="text-sm zynq-muted">External Labour Paid Amount</CardHeader>
                <CardContent className="text-2xl font-semibold text-[color:var(--danger)]">
                  {summaryExternalLabourPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <div className="flex gap-2" />
          </CardHeader>
          <CardContent>
            <Table
              columns={invoicesColumns}
              data={Array.isArray(viewInvoices) ? viewInvoices : []}
              emptyText="No invoices"
            />
            <div className="mt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/finance/invoices')}
              >
                View all invoices
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        {creating || editing ? (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[color:var(--surface)] zynq-border border rounded-md p-4 w-[min(520px,95vw)] space-y-3">
              <div className="text-base font-semibold">{creating ? 'Add Invoice' : 'Edit Invoice'}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Invoice No." value={form.number} onChange={(e) => setForm({ ...form, number: (e.target as HTMLInputElement).value })} />
                <Input label="Client" value={form.client} onChange={(e) => setForm({ ...form, client: (e.target as HTMLInputElement).value })} />
                <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: (e.target as HTMLInputElement).value })} />
                <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: (e.target as HTMLInputElement).value })} />
                <Input label="Amount" type="number" value={String(form.amount)} onChange={(e) => setForm({ ...form, amount: Number((e.target as HTMLInputElement).value) || 0 })} />
                <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: (e.target as HTMLSelectElement).value as any })}>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => { setCreating(false); setEditing(null); }} disabled={busy}>Cancel</Button>
                {creating ? (
                  <Button onClick={handleCreate} disabled={busy}>Create</Button>
                ) : (
                  <Button onClick={handleEdit} disabled={busy}>Save</Button>
                )}
              </div>
              <div className="text-xs zynq-muted">{/* TODO: Backend requires valid projectId and clientId for create */}</div>
            </div>
          </div>
        ) : null}

        {/* Delete confirm */}
        {deleting ? (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[color:var(--surface)] zynq-border border rounded-md p-4 w-[min(420px,95vw)] space-y-3">
              <div className="text-base font-semibold">Delete Invoice</div>
              <div className="text-sm">Are you sure you want to delete invoice <span className="font-medium">{deleting.number}</span>?</div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setDeleting(null)} disabled={busy}>Cancel</Button>
                <Button variant="danger" onClick={handleDelete} disabled={busy}>Delete</Button>
              </div>
            </div>
          </div>
        ) : null}

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Expense Invoice</CardTitle>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={resetPaymentFilters}>Reset</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table
              columns={paymentsColumns}
              data={Array.isArray(viewPayments) ? viewPayments : []}
              emptyText="No expense invoices"
            />
            <div className="mt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/finance/expenses/expense')}
              >
                View all expense invoices
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* General Expenses preview (5 rows) */}
        <Card className="mt-6">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>General Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<GeneralExpenseRow>
              columns={generalColumns}
              data={Array.isArray(generalExpenses) ? generalExpenses.slice(0, 5) : []}
              emptyText="No general expenses"
            />
            <div className="mt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/finance/expenses/general')}
              >
                View all general expenses
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Company Employee Salary preview (5 rows) */}
        <Card className="mt-6">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Company Employee Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<SalaryPreviewRow>
              columns={salaryColumns}
              data={Array.isArray(salaryPreview) ? salaryPreview.slice(0, 5) : []}
              emptyText="No salary expenses"
            />
            <div className="mt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/finance/expenses/company-employee-salary')}
              >
                View all company employee salary
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* External Labour Expense preview (5 rows) */}
        <Card className="mt-6">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>External Labour Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<ExternalLabourPreviewRow>
              columns={externalLabourColumns}
              data={Array.isArray(externalLabourPreview) ? externalLabourPreview.slice(0, 5) : []}
              emptyText="No external labour expenses"
            />
            <div className="mt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/finance/expenses/manpower/external-labour-expense')}
              >
                View all external labour expense
              </Button>
            </div>
          </CardContent>
        </Card>
      </IonContent>
    </IonPage>
  );
}

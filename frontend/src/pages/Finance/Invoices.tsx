import React from 'react';
import { IonPage, IonContent, IonSpinner, useIonToast, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Table, { Column } from '../../ui/Table';
import AdvancedTable, { AdvColumn, SortState } from '../../ui/AdvancedTable';
import BulkImportModal from '../../ui/BulkImportModal';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { useQueryParam } from '../../hooks/useQueryParam';
import { useAuth } from '../../auth/AuthContext';
import { InvoiceDto, fetchInvoices, createInvoice, updateInvoice, deleteInvoice, exportInvoicesCsv, bulkCreateInvoices } from '../../api/financeService';
import { fetchDocumentCompanies, DocumentCompanyDto } from '../../api/documentsService';
import { fetchProjects, ProjectDto } from '../../api/projectsService';
import { fetchClients, ClientDto } from '../../api/clientsService';
import * as XLSX from 'xlsx';
import { chevronBackOutline } from 'ionicons/icons';

 type Row = { id: string; company?: string; subject?: string; invoice_date: string; invoice_no?: string; due_date?: string; projectId: string; clientId: string; subtotal: number; vat: number; total: number; status?: string };

function DetailInvoiceModal({ row, projects, clients, onClose, currentUserToken }: { row: Row | null; projects: ProjectDto[]; clients: ClientDto[]; onClose: () => void; currentUserToken: string }) {
  if (!row) return null;
  const projectName = projects.find(p => p.id === row.projectId)?.name || row.projectId;
  const clientName = clients.find(c => c.id === row.clientId)?.name || row.clientId;
  const subTotal = Number(row.subtotal || 0);
  const vat = Math.round(subTotal * 0.05 * 100) / 100;
  const total = Math.round((subTotal + vat) * 100) / 100;
  const invoiceNo = row.invoice_no || `INV-${(row.id || '').substring(0,6).toUpperCase()}`;
  let enteredBy = 'User';
  try {
    const payload = JSON.parse(atob((currentUserToken || '').split('.')[1] || '')) || {};
    enteredBy = payload.name || payload.username || payload.email || enteredBy;
  } catch {}
  return (
    <Modal open={!!row} onClose={onClose} title="Invoice Details">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="zynq-muted text-xs">Date</div>
            <div className="font-medium">{new Date(row.invoice_date).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="zynq-muted text-xs">Invoice No</div>
            <div className="font-medium">{invoiceNo}</div>
          </div>
          <div>
            <div className="zynq-muted text-xs">Project</div>
            <div className="font-medium">{projectName}</div>
          </div>
          <div>
            <div className="zynq-muted text-xs">Client</div>
            <div className="font-medium">{clientName}</div>
          </div>
          <div>
            <div className="zynq-muted text-xs">Status</div>
            <div className="font-medium">{(() => { const v = String(row.status || '').toLowerCase(); return (v === 'paid' || v === 'received') ? 'Received' : 'Pending'; })()}</div>
          </div>
          <div>
            <div className="zynq-muted text-xs">Entered By</div>
            <div className="font-medium">{enteredBy}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-right">
            <div className="zynq-muted text-xs">Sub-Total</div>
            <div className="font-semibold">{subTotal.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="zynq-muted text-xs">VAT (5%)</div>
            <div className="font-semibold">{vat.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="zynq-muted text-xs">Total</div>
            <div className="font-semibold">{total.toLocaleString()}</div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Back to Invoices</Button>
        </div>
      </div>
    </Modal>
  );
}

 export default function Invoices() {
  const navigate = useNavigate();
  const [present] = useIonToast();
  const { accessToken, role } = useAuth();
  const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';
  const [q, setQ] = useQueryParam<string>('invQ', '');
  const [projectId, setProjectId] = useQueryParam<string>('invProject', '');
  const [clientId, setClientId] = useQueryParam<string>('invClient', '');
  const [status, setStatus] = useQueryParam<string>('invStatus', 'All');
  const [dateFrom, setDateFrom] = useQueryParam<string>('invFrom', '');
  const [dateTo, setDateTo] = useQueryParam<string>('invTo', '');
  const [page, setPage] = useQueryParam<number>('invPage', 1);
  const pageSize = 10;

  const [rows, setRows] = React.useState<Row[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [projects, setProjects] = React.useState<ProjectDto[]>([]);
  const [clients, setClients] = React.useState<ClientDto[]>([]);
  const [sumLoading, setSumLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<{ subTotal: number; vat: number; total: number; pendingAmount: number }>({ subTotal: 0, vat: 0, total: 0, pendingAmount: 0 });

  const [addOpen, setAddOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<Row | null>(null);
  const [detailRow, setDetailRow] = React.useState<Row | null>(null);

  const [importing, setImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewRows, setPreviewRows] = React.useState<Array<Partial<{ projectId: string; clientId: string; invoice_date: string; due_date?: string; items_json: any; subtotal: number; vat: number; total: number; status?: string }> & { _err?: string; _row?: number }>>([]);

  const [sort, setSort] = React.useState<SortState>(null);
  const [companies, setCompanies] = React.useState<DocumentCompanyDto[]>([]);
  const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState('');
  const [pendingImportRows, setPendingImportRows] = React.useState<any[]>([]);
  const [companyFilter, setCompanyFilter] = React.useState('');

  const cols: AdvColumn<Row>[] = [
    { key: 'company', header: 'Company', render: (r) => r.company || '', sortable: true },
    { key: 'invoice_date', header: 'Date', render: (r) => new Date(r.invoice_date).toLocaleDateString(), sortable: true },
    { key: 'invoice_no', header: 'Invoice No', render: (r) => r.invoice_no || `INV-${(r.id||'').substring(0,6).toUpperCase()}` },
    { key: 'subject', header: 'Subject', render: (r) => r.subject || '' },
    { key: 'projectId', header: 'Project', render: (r) => (projects.find(p => p.id === r.projectId)?.name || r.projectId) },
    { key: 'clientId', header: 'Client', render: (r) => (clients.find(c => c.id === r.clientId)?.name || r.clientId) },
    { key: 'status', header: 'Status', render: (r) => {
      const v = (r.status || 'Pending').toLowerCase();
      const isReceived = v === 'received' || v === 'paid';
      const label = isReceived ? 'Received' : 'Pending';
      const cls = isReceived ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
    } },
    { key: 'subtotal', header: 'Sub-Total', render: (r) => <div className="text-right">{Number(r.subtotal||0).toLocaleString()}</div> },
    { key: 'vat', header: 'VAT (5%)', render: (r) => <div className="text-right">{Number(r.vat||0).toLocaleString()}</div> },
    { key: 'total', header: 'Total', render: (r) => <div className="text-right">{Number(r.total||0).toLocaleString()}</div>, sortable: true },
    { key: 'actions', header: 'Actions', render: (r) => (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="secondary" onClick={() => setEditRow(r)}>Edit</Button>
        {!isTeamLeader && (
          <Button size="sm" variant="secondary" onClick={() => onDelete(r)}>Delete</Button>
        )}
      </div>
    ) },
  ];

  React.useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') || undefined;
      try {
        const [ps, cs] = await Promise.all([
          fetchProjects({ page: 1, pageSize: 200, token }),
          fetchClients({ token })
        ]);
        setProjects(ps.data ?? []);
        setClients(cs ?? []);
      } catch {
        // ignore
      }
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      if (companies.length) return;
      const token = localStorage.getItem('token') || undefined;
      try {
        const res = await fetchDocumentCompanies({ page: 1, pageSize: 200, token });
        setCompanies(res.data || []);
      } catch {
        setCompanies([]);
      }
    })();
  }, [companies.length]);

  React.useEffect(() => { setPage(1); // reset to first page on filter/sort change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, clientId, status, dateFrom, dateTo, q, sort?.key, sort?.dir]);

  React.useEffect(() => { load(); }, [page, projectId, clientId, status, dateFrom, dateTo, q, sort?.key, sort?.dir]);

  React.useEffect(() => { loadSummary(); }, [projectId, clientId, status, dateFrom, dateTo, q]);

  const filteredRows = React.useMemo(() => {
    let data = rows;

    if (status === 'Pending' || status === 'Received') {
      data = data.filter((r) => {
        const v = (r.status || '').toLowerCase();
        const isReceived = v === 'received' || v === 'paid';
        return status === 'Received' ? isReceived : !isReceived;
      });
    }

    if (companyFilter) {
      data = data.filter((r) => r.company === companyFilter);
    }

    return data;
  }, [rows, status, companyFilter]);

  async function loadSummary() {
    const token = localStorage.getItem('token') || undefined;
    try {
      setSumLoading(true);
      let p = 1;
      const ps = 100;
      let sub = 0;       // Received only
      let vatSum = 0;    // Received only
      let totalSum = 0;  // Received only (subtotal + vat)
      let pending = 0;   // Pending only (subtotal + vat)
      while (true) {
        const res = await fetchInvoices({
          projectId: projectId || undefined,
          clientId: clientId || undefined,
          status: status || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          search: q || undefined,
          page: p,
          pageSize: ps,
          token,
        });
        const data = ((res as any).rows ?? (res as any).data ?? []) as any[];
        for (const inv of data) {
          const s = Number(inv.subtotal || 0);
          const v = Number(inv.vat != null ? inv.vat : Math.round(s * 0.05 * 100) / 100);
          const st = String(inv.status || '').toLowerCase();
          const isReceived = st === 'received' || st === 'paid';
          const isPending = st === 'pending' || (!isReceived && st !== '');
          if (isReceived) {
            // Only Received contributes to Sub-Total, VAT, and Total (which is s + v)
            sub += s;
            vatSum += v;
            totalSum += (s + v);
          }
          if (isPending) {
            // Pending card shows combined Sub-Total + VAT for Pending only
            pending += (s + v);
          }
        }
        if (data.length < ps) break;
        p += 1;
      }
      setSummary({
        subTotal: Math.round(sub * 100) / 100,
        vat: Math.round(vatSum * 100) / 100,
        total: Math.round(totalSum * 100) / 100,
        pendingAmount: Math.round(pending * 100) / 100,
      });
    } catch (e) {
      console.error('Invoices summary load error:', e);
      setSummary({ subTotal: 0, vat: 0, total: 0, pendingAmount: 0 });
    } finally {
      setSumLoading(false);
    }
  }

  async function load() {
    const token = localStorage.getItem('token') || undefined;
    try {
      setLoading(true);
      const res = await fetchInvoices({ projectId: projectId || undefined, clientId: clientId || undefined, status: status || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, search: q || undefined, sortKey: sort?.key, sortDir: sort?.dir, page, pageSize, token });
      const data = (res as any).rows ?? (res as any).data ?? [];
      const mapped: Row[] = data.map((inv: InvoiceDto & { items_json?: any }) => {
        const rawItems = (inv as any).items_json;
        let items: any = {};
        if (rawItems) {
          if (typeof rawItems === 'string') {
            try {
              items = JSON.parse(rawItems);
            } catch {
              items = {};
            }
          } else {
            items = rawItems;
          }
        }
        const company = typeof items?.company === 'string' ? items.company : undefined;
        const subject = typeof items?.subject === 'string' ? items.subject : undefined;
        return {
          id: inv.id,
          company,
          subject,
          invoice_date: inv.invoice_date,
          invoice_no: inv.invoice_no,
          due_date: inv.due_date,
          projectId: inv.projectId,
          clientId: inv.clientId,
          subtotal: inv.subtotal,
          vat: inv.vat,
          total: inv.total,
          status: inv.status,
        };
      });
      setRows(mapped);
      setTotal((res as any).total ?? mapped.length);
    } catch (e: any) {
      console.error('Invoices load error:', e);
      setRows([]); setTotal(0);
      const msg = e?.message || '';
      if (/HTTP\s(4|5)\d{2}/.test(msg)) {
        present({ message: 'Failed to load invoices', color: 'danger', duration: 1800, position: 'top' });
      }
    } finally { setLoading(false); }
  }

  async function onCreate(body: { projectId: string; clientId: string; invoice_no?: string; invoice_date: string; due_date?: string; items_json: any; subtotal: number; vat: number; total: number; status?: string }) {
    const token = localStorage.getItem('token') || undefined;
    try {
      const items_json = typeof body.items_json === 'string' ? body.items_json : JSON.stringify(body.items_json || {});
      await createInvoice({ token }, { ...body, items_json });
      present({ message: 'Invoice created', color: 'success', duration: 1400, position: 'top' });
      setAddOpen(false);
      load();
      loadSummary();
    } catch (e: any) {
      const msg = e?.message || '';
      const pretty = /HTTP\s\d+\:\s*(.*)/.exec(msg)?.[1] || msg || 'Create failed';
      present({ message: pretty, color: 'danger', duration: 2200, position: 'top' });
    }
  }

  async function onUpdate(row: Row, body: Partial<{ invoice_no?: string; invoice_date: string; due_date?: string; items_json: any; subtotal: number; vat: number; total: number; status?: string }>) {
    const token = localStorage.getItem('token') || undefined;
    try {
      const normalized: any = { ...body };
      if (Object.prototype.hasOwnProperty.call(body, 'items_json')) {
        const v: any = (body as any).items_json;
        normalized.items_json = typeof v === 'string' ? v : (v == null ? undefined : JSON.stringify(v));
      }
      await updateInvoice({ id: row.id, token }, normalized);
      present({ message: 'Invoice updated', color: 'success', duration: 1400, position: 'top' });
      setEditRow(null);
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, ...normalized } as any : r));
      loadSummary();
    } catch (e: any) {
      const msg = e?.message || '';
      const pretty = /HTTP\s\d+\:\s*(.*)/.exec(msg)?.[1] || msg || 'Update failed';
      present({ message: pretty, color: 'danger', duration: 2200, position: 'top' });
    }
  }

  async function onDelete(row: Row) {
    const token = localStorage.getItem('token') || undefined;
    try {
      const ok = window.confirm('Are you sure you want to delete this invoice?');
      if (!ok) return;
      await deleteInvoice({ id: row.id, token });
      present({ message: 'Invoice deleted', color: 'success', duration: 1400, position: 'top' });
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setTotal((t) => Math.max(0, t - 1));
      loadSummary();
    } catch {
      present({ message: 'Delete failed', color: 'danger', duration: 1800, position: 'top' });
    }
  }

  async function onExportCsv() {
    const token = localStorage.getItem('token') || undefined;
    try {
      const csv = await exportInvoicesCsv({ projectId: projectId || undefined, clientId: clientId || undefined, status: status || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, search: q || undefined, token });
      const blob = new Blob([csv as any], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'invoices.csv'; a.click(); URL.revokeObjectURL(url);
    } catch {
      present({ message: 'Export failed', color: 'danger', duration: 1800, position: 'top' });
    }
  }

  function onPickExcel() { if (fileInputRef.current) fileInputRef.current.click(); }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setImporting(true);
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const firstSheetName = (wb.SheetNames && wb.SheetNames.length > 0) ? wb.SheetNames[0] : undefined;
      if (!firstSheetName) throw new Error('No sheets found');
      const ws = wb.Sheets[firstSheetName];
      if (!ws) throw new Error('Worksheet not found');
      const json = XLSX.utils.sheet_to_json<any>(ws, { raw: false, defval: '' });
      const normalized = json.map((r: any, idx: number) => {
        // Align expected Excel headers with Add Invoice form fields
        // Preferred headers: Invoice Date, Invoice No, Subject, Company, Project, Client, Subtotal, VAT, Total, Status
        const invoice_date =
          r.invoice_date ||
          r["Invoice Date"] ||
          r.date ||
          r.Date ||
          '';
        const invoice_no = r.invoice_no || r["Invoice No"] || r.invoiceNo || '';
        const subject = r.subject || r.Subject || '';
        const companyName = r.company || r.Company || '';
        const project = r.projectId || r["Project ID"] || r.project || r.Project || '';
        const client = r.clientId || r["Client ID"] || r.client || r.Client || '';
        const subtotal = Number(r.subtotal || r.Subtotal || r["Subtotal"] || 0);
        const vat = Number(r.vat || r.VAT || r["VAT"] || 0);
        const total = Number(r.total || r.Total || r["Total"] || (subtotal + vat));
        const status = r.status || r.Status || r["Status"] || 'Pending';

        // Build items_json similar to Add Invoice (company + subject + any existing JSON)
        let items: any = {};
        const rawItems = r.items_json || r.items || r.Items || '';
        if (typeof rawItems === 'string' && rawItems.trim()) {
          try {
            items = JSON.parse(rawItems);
          } catch {
            items = {};
          }
        } else if (rawItems && typeof rawItems === 'object') {
          items = rawItems;
        }
        if (companyName) items.company = companyName;
        if (subject) items.subject = subject;

        const row: any = {
          projectId: String(project),
          clientId: String(client),
          invoice_date,
          due_date: undefined as string | undefined,
          invoice_no: invoice_no || undefined,
          items_json: items,
          subtotal,
          vat,
          total,
          status,
        };
        const errs: string[] = [];
        if (!row.projectId) errs.push('projectId');
        if (!row.clientId) errs.push('clientId');
        if (!invoice_date) errs.push('invoice_date');
        if (!(total > 0)) errs.push('total');
        return { ...row, _row: idx + 2, _err: errs.length ? `Missing/invalid: ${errs.join(', ')}` : undefined };
      });
      setPreviewRows(normalized);
      setPreviewOpen(true);
    } catch {
      present({ message: 'Failed to parse Excel', color: 'danger', duration: 2000, position: 'top' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function onConfirmImport(valid: any[]) {
    const cleaned = (valid || []).filter((r) => !r._err);
    if (!cleaned.length) {
      present({ message: 'No valid rows to import', color: 'warning', duration: 1600, position: 'top' });
      return;
    }
    setPendingImportRows(cleaned);
    setSelectedCompanyId('');
    setCompanyModalOpen(true);
  }

  async function onConfirmImportWithCompany() {
    const token = localStorage.getItem('token') || undefined;
    if (!pendingImportRows.length) {
      setCompanyModalOpen(false);
      return;
    }
    if (!selectedCompanyId) {
      present({ message: 'Please select a company', color: 'warning', duration: 1600, position: 'top' });
      return;
    }

    const company = companies.find((c) => c.id === selectedCompanyId);
    const companyName = company?.name || '';

    try {
      setImporting(true);
      const payload = pendingImportRows.map((r: any) => {
        let items: any = {};
        if (r.items_json) {
          if (typeof r.items_json === 'string') {
            try {
              items = JSON.parse(r.items_json);
            } catch {
              items = {};
            }
          } else {
            items = r.items_json;
          }
        }
        items = { ...items, company: companyName };
        return {
          projectId: r.projectId,
          clientId: r.clientId,
          invoice_date: r.invoice_date,
          due_date: r.due_date,
          items_json: items,
          subtotal: r.subtotal,
          vat: r.vat,
          total: r.total,
          status: r.status,
          token,
        };
      });

      await bulkCreateInvoices(payload as any);
      present({ message: `Imported ${pendingImportRows.length} rows`, color: 'success', duration: 1600, position: 'top' });
      setCompanyModalOpen(false);
      setPreviewOpen(false);
      setPendingImportRows([]);
      setPreviewRows([]);
      load();
      loadSummary();
    } catch {
      present({ message: 'Import failed', color: 'danger', duration: 2000, position: 'top' });
    } finally {
      setImporting(false);
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)] py-8">
        <div className="space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold hidden lg:block">Finance / Invoices</div>
          <div className="zynq-muted text-sm hidden lg:block">Home &gt; Finance &gt; Invoices</div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 flex items-center gap-2"
              onClick={() => navigate('/finance')}
            >
              <IonIcon icon={chevronBackOutline} />
              <span>Back</span>
            </Button>
          </div>
          <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={onExportCsv}>Export CSV</Button>
              <Button size="sm" onClick={() => setAddOpen(true)}>Add Invoice</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="border border-[color:var(--border)] rounded-md p-3 bg-[color:var(--muted)]/20">
                <div className="text-xs zynq-muted">Sub-Total</div>
                <div className="text-xl font-semibold">{sumLoading ? '…' : summary.subTotal.toLocaleString()}</div>
              </div>
              <div className="border border-[color:var(--border)] rounded-md p-3 bg-[color:var(--muted)]/20">
                <div className="text-xs zynq-muted">VAT (5%)</div>
                <div className="text-xl font-semibold">{sumLoading ? '…' : summary.vat.toLocaleString()}</div>
              </div>
              <div className="border border-[color:var(--border)] rounded-md p-3 bg-[color:var(--muted)]/20">
                <div className="text-xs zynq-muted">Total</div>
                <div className="text-xl font-semibold text-green-600 dark:text-green-400">{sumLoading ? '…' : summary.total.toLocaleString()}</div>
              </div>
              <div className="border border-[color:var(--border)] rounded-md p-3 bg-[color:var(--muted)]/20">
                <div className="text-xs zynq-muted">Pending Amount</div>
                <div className="text-xl font-semibold text-red-600 dark:text-red-400">{sumLoading ? '…' : summary.pendingAmount.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
              <Input label="Search" placeholder="Items or status" value={q} onChange={(e) => setQ((e.target as HTMLInputElement).value)} />
              <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">All</option>
                {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </Select>
              <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">All</option>
                {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </Select>
              <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
              </Select>
              <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom((e.target as HTMLInputElement).value)} />
              <Select label="Company" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                <option value="">All companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm">
              <div className="zynq-muted">Showing {rows.length} of {total} records</div>
            </div>
            <AdvancedTable<Row>
              columns={cols}
              data={filteredRows}
              loading={loading}
              page={page}
              pageSize={pageSize}
              total={total}
              sort={sort}
              onSortChange={(s) => setSort(s)}
              onPageChange={(p) => setPage(p)}
              stickyHeader
              emptyText="No invoices"
              onRowClick={(r) => setDetailRow(r)}
            />
          </CardContent>
        </Card>
        </div>
      </IonContent>

      <AddInvoiceModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={onCreate} projects={projects} clients={clients} companies={companies} />
      {editRow ? (
        <EditInvoiceModal
          row={editRow}
          companies={companies}
          clients={clients}
          onClose={() => setEditRow(null)}
          onSubmit={(body) => onUpdate(editRow, body)}
        />
      ) : null}
      <DetailInvoiceModal row={detailRow} projects={projects} clients={clients} onClose={() => setDetailRow(null)} currentUserToken={accessToken || ''} />

      <BulkImportModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fields={[
          { key: 'invoice_date', label: 'Invoice Date', required: true },
          { key: 'invoice_no', label: 'Invoice No' },
          { key: 'subject', label: 'Subject' },
          { key: 'company', label: 'Company' },
          { key: 'project', label: 'Project' },
          { key: 'client', label: 'Client' },
          { key: 'subtotal', label: 'Subtotal', required: true },
          { key: 'vat', label: 'VAT (5%)' },
          { key: 'total', label: 'Total', required: true },
          { key: 'status', label: 'Status' },
        ]}
        onValidate={(r) => {
          const errs: string[] = [];
          if (!r.invoice_date) errs.push('invoice_date');
          if (!r.projectId) errs.push('projectId');
          if (!r.clientId) errs.push('clientId');
          if (!(Number(r.total) > 0)) errs.push('total');
          return errs.length ? errs.join(', ') : undefined;
        }}
        onConfirm={onConfirmImport}
        templateHint="Expected columns: Invoice Date, Invoice No, Subject, Company, Project ID, Client ID, Subtotal, VAT, Total, Status"
      />

      <Modal
        open={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        title="Select Company"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCompanyModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirmImportWithCompany} disabled={!selectedCompanyId}>
              Import
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Select
            label="Company"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </Modal>
    </IonPage>
  );
}

function AddInvoiceModal({ open, onClose, onSubmit, projects, clients, companies }: { open: boolean; onClose: () => void; onSubmit: (b: { projectId: string; clientId: string; invoice_no?: string; invoice_date: string; due_date?: string; items_json: any; subtotal: number; vat: number; total: number; status?: string }) => void | Promise<void>; projects: ProjectDto[]; clients: ClientDto[]; companies: DocumentCompanyDto[] }) {
  const [invoiceDate, setInvoiceDate] = React.useState('');
  const [invoiceNo, setInvoiceNo] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [projectId, setProjectId] = React.useState('');
  const [clientId, setClientId] = React.useState('');
  const [subtotal, setSubtotal] = React.useState<number>(0);
  const [vat, setVat] = React.useState<number>(0);
  const total = React.useMemo(() => {
    const sub = subtotal || 0;
    const v = vat || 0;
    return Math.max(0, sub + v);
  }, [subtotal, vat]);
  const [status, setStatus] = React.useState('Pending');
  const [itemsJson, setItemsJson] = React.useState('');
  const [companyId, setCompanyId] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [localProjects, setLocalProjects] = React.useState<ProjectDto[]>(projects);
  const [allClients, setAllClients] = React.useState<ClientDto[]>(clients);
  const [localClients, setLocalClients] = React.useState<ClientDto[]>(clients);
  React.useEffect(() => { if (!open) { setInvoiceDate(''); setInvoiceNo(''); setDueDate(''); setSubject(''); setProjectId(''); setClientId(''); setSubtotal(0); setVat(0); setStatus('Pending'); setItemsJson(''); setCompanyId(''); } }, [open]);
  // When subtotal changes (user edits Subtotal), keep VAT at 5% and recompute Total via memo
  React.useEffect(() => {
    if (!subtotal) {
      setVat(0);
      return;
    }
    const v = Math.round(subtotal * 0.05 * 100) / 100;
    setVat(v);
  }, [subtotal]);
  React.useEffect(() => {
    if (!open) return;
    (async () => {
      const token = localStorage.getItem('token') || undefined;
      try {
        const ps = await fetchProjects({ page: 1, pageSize: 500, companyId: companyId || undefined, token });
        setLocalProjects(ps.data ?? []);
      } catch {
        setLocalProjects(projects);
      }
      try {
        const cs = await fetchClients({ token });
        setAllClients(cs ?? clients);
      } catch {
        setAllClients(clients);
      }
    })();
  }, [open, projects, companyId, clients]);

  // For Edit: keep existing project/client when opening.
  // If the user later changes company manually, they can adjust Project/Client themselves.

  // Derive clients belonging to projects under the selected company
  React.useEffect(() => {
    if (!companyId) {
      setLocalClients([]);
      return;
    }

    // If a project is selected, restrict clients to that project's client only
    const selectedProject = projectId
      ? localProjects.find((p) => p.id === projectId)
      : undefined;

    if (selectedProject?.clientId) {
      const client = allClients.find((c) => c.id === selectedProject.clientId);
      setLocalClients(client ? [client] : []);
      return;
    }

    // Otherwise, show all clients belonging to projects under the selected company
    const clientIds = new Set<string>();
    for (const p of localProjects) {
      if (p.clientId) clientIds.add(p.clientId);
    }
    const filtered = allClients.filter((c) => clientIds.has(c.id));
    setLocalClients(filtered);
  }, [companyId, projectId, localProjects, allClients]);

  // When project changes, automatically enforce the matching client
  React.useEffect(() => {
    if (!projectId) return;
    const proj = localProjects.find((p) => p.id === projectId);
    if (proj?.clientId) {
      setClientId(proj.clientId);
    }
  }, [projectId, localProjects]);
  const labelFor = React.useCallback((p: ProjectDto) => {
    const parent = p.parentId ? localProjects.find(x => x.id === p.parentId) : undefined;
    return parent ? `${parent.name} / ${p.name}` : p.name;
  }, [localProjects]);
  const canCreate = !!invoiceDate && !!invoiceNo && !!projectId && !!clientId && !!companyId && !!subject && total > 0;

  const invoiceDateError = !invoiceDate ? 'Required' : '';
  const invoiceNoError = !invoiceNo ? 'Required' : '';
  const subjectError = !subject ? 'Required' : '';
  const companyError = !companyId ? 'Required' : '';
  const projectError = !projectId ? 'Required' : '';
  const clientError = !clientId ? 'Required' : '';
  const totalError = !(total > 0) ? 'Required' : '';
  return (
    <Modal open={open} onClose={onClose} title="Add Invoice">
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        <Input label="Invoice Date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate((e.target as HTMLInputElement).value)} error={invoiceDateError} />
        <Input label="Invoice No" placeholder="INV-001" value={invoiceNo} onChange={(e) => setInvoiceNo((e.target as HTMLInputElement).value)} error={invoiceNoError} />
        <Input label="Subject" value={subject} onChange={(e) => setSubject((e.target as HTMLInputElement).value)} error={subjectError} />
        <Select label="Company" value={companyId} onChange={(e) => setCompanyId(e.target.value)} error={companyError}>
          <option value="">(Select)</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} error={projectError} disabled={!companyId || submitting || !localProjects.length}>
          <option value="">(Select)</option>
          {localProjects.map(p => (<option key={p.id} value={p.id}>{labelFor(p)}</option>))}
        </Select>
        <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)} error={clientError} disabled={!companyId || submitting || !localClients.length}>
          <option value="">(Select)</option>
          {localClients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </Select>
        <Input
          label="Subtotal"
          type="number"
          value={String(subtotal)}
          onChange={(e) => {
            const v = Number((e.target as HTMLInputElement).value) || 0;
            setSubtotal(v);
          }}
        />
        <Input
          label="VAT (5%)"
          type="number"
          value={String(vat)}
          onChange={() => {}}
          disabled
        />
        <Input
          label="Total"
          type="number"
          value={String(total)}
          onChange={(e) => {
            const newTotal = Number((e.target as HTMLInputElement).value) || 0;
            if (!newTotal) {
              setSubtotal(0);
              setVat(0);
              return;
            }
            const newSubtotal = Math.round((newTotal / 1.05) * 100) / 100;
            const newVat = Math.max(0, Math.round((newTotal - newSubtotal) * 100) / 100);
            setSubtotal(newSubtotal);
            setVat(newVat);
          }}
          error={totalError}
        />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Pending">Pending</option>
          <option value="Received">Received</option>
        </Select>
        <Input label="Items JSON (optional)" value={itemsJson} onChange={(e) => setItemsJson((e.target as HTMLInputElement).value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={async () => {
              setSubmitting(true);
              try {
                const raw = itemsJson ? JSON.parse(itemsJson) : {};
                const company = companies.find((c) => c.id === companyId)?.name || '';
                const items = { ...raw, company, subject: subject || undefined };
                await onSubmit({ projectId, clientId, invoice_no: invoiceNo || undefined, invoice_date: invoiceDate, due_date: dueDate || undefined, items_json: items, subtotal, vat, total, status });
              } catch {
                window.alert('Invalid items JSON');
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!canCreate || submitting}
          >
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EditInvoiceModal({ row, companies, clients, onClose, onSubmit }: { row: Row | null; companies: DocumentCompanyDto[]; clients: ClientDto[]; onClose: () => void; onSubmit: (b: Partial<{ projectId: string; invoice_no?: string; invoice_date: string; due_date?: string; items_json: any; subtotal: number; vat: number; total: number; status?: string }>) => void | Promise<void> }) {
  const normDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d as any).toISOString().slice(0,10); } catch { return ''; }
  };
  const initialInvoiceNo = React.useMemo(() => {
    if (!row) return '';
    if (row.invoice_no && row.invoice_no.trim()) return row.invoice_no;
    const id = row.id || '';
    return id ? `INV-${id.substring(0, 6).toUpperCase()}` : '';
  }, [row]);
  const [invoiceDate, setInvoiceDate] = React.useState(normDate(row?.invoice_date));
  const [invoiceNo, setInvoiceNo] = React.useState(initialInvoiceNo);
  const [dueDate, setDueDate] = React.useState(normDate(row?.due_date));
  const [subtotal, setSubtotal] = React.useState<number>(row?.subtotal || 0);
  const [vat, setVat] = React.useState<number>(row?.vat || 0);
  const total = React.useMemo(() => Math.max(0, (subtotal || 0) + (vat || 0)), [subtotal, vat]);
  const [status, setStatus] = React.useState((String(row?.status).toLowerCase() === 'paid' || String(row?.status).toLowerCase() === 'received') ? 'Received' : 'Pending');
  const [itemsJson, setItemsJson] = React.useState('');
  const [projectId, setProjectId] = React.useState(row?.projectId || '');
  const [clientId, setClientId] = React.useState(row?.clientId || '');
  const [subject, setSubject] = React.useState(row?.subject || '');
  const [companyId, setCompanyId] = React.useState<string>(() => {
    const initial = companies.find((c) => c.name === (row?.company || ''));
    return initial?.id || '';
  });
  const [localProjects, setLocalProjects] = React.useState<ProjectDto[]>([]);
  const [allClients, setAllClients] = React.useState<ClientDto[]>(clients);
  const [localClients, setLocalClients] = React.useState<ClientDto[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  React.useEffect(() => {
    setInvoiceDate(normDate(row?.invoice_date));
    setInvoiceNo(initialInvoiceNo);
    setDueDate(normDate(row?.due_date));
    setSubtotal(row?.subtotal || 0);
    setVat(row?.vat || 0);
    setStatus((String(row?.status).toLowerCase() === 'paid' || String(row?.status).toLowerCase() === 'received') ? 'Received' : 'Pending');
    setItemsJson('');
    setProjectId(row?.projectId || '');
    setClientId(row?.clientId || '');
    const initial = companies.find((c) => c.name === (row?.company || ''));
    setCompanyId(initial?.id || '');
  }, [row, companies, initialInvoiceNo]);

  React.useEffect(() => {
    if (!row) return;
    (async () => {
      const token = localStorage.getItem('token') || undefined;
      try {
        const ps = await fetchProjects({ page: 1, pageSize: 500, companyId: companyId || undefined, token });
        setLocalProjects(ps.data ?? []);
      } catch {
        setLocalProjects([]);
      }
      try {
        const cs = await fetchClients({ token });
        setAllClients(cs ?? clients);
      } catch {
        setAllClients(clients);
      }
    })();
  }, [row, companyId, clients]);

  // Derive clients belonging to projects under the selected company
  React.useEffect(() => {
    if (!companyId) {
      setLocalClients([]);
      return;
    }
    const clientIds = new Set<string>();
    for (const p of localProjects) {
      if (p.clientId) clientIds.add(p.clientId);
    }
    const filtered = allClients.filter((c) => clientIds.has(c.id));
    setLocalClients(filtered);
  }, [companyId, localProjects, allClients]);
  React.useEffect(() => { setVat(Math.round((subtotal * 0.05) * 100) / 100); }, [subtotal]);
  if (!row) return null;
  const labelFor = React.useCallback((p: ProjectDto) => {
    const parent = p.parentId ? localProjects.find(x => x.id === p.parentId) : undefined;
    return parent ? `${parent.name} / ${p.name}` : p.name;
  }, [localProjects]);
  const canSave = !!invoiceDate && !!invoiceNo && !!subject && !!companyId && !!projectId && !!clientId && total > 0;
  const invoiceDateError = !invoiceDate ? 'Required' : '';
  const invoiceNoError = !invoiceNo ? 'Required' : '';
  const subjectError = !subject ? 'Required' : '';
  const companyError = !companyId ? 'Required' : '';
  const projectError = !projectId ? 'Required' : '';
  const clientError = !clientId ? 'Required' : '';
  const totalError = !(total > 0) ? 'Required' : '';
  return (
    <Modal open={!!row} onClose={onClose} title="Edit Invoice">
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        <Input label="Invoice Date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate((e.target as HTMLInputElement).value)} error={invoiceDateError} />
        <Input label="Invoice No" placeholder="INV-001" value={invoiceNo} onChange={(e) => setInvoiceNo((e.target as HTMLInputElement).value)} error={invoiceNoError} />
        <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate((e.target as HTMLInputElement).value)} />
        <Input label="Subject" value={subject} onChange={(e) => setSubject((e.target as HTMLInputElement).value)} error={subjectError} />
        <Select label="Company" value={companyId} onChange={(e) => setCompanyId(e.target.value)} error={companyError}>
          <option value="">(Select)</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} error={projectError} disabled={!companyId || submitting || !localProjects.length}>
          <option value="">(Select)</option>
          {localProjects.map(p => (<option key={p.id} value={p.id}>{labelFor(p)}</option>))}
        </Select>
        <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)} error={clientError} disabled={!companyId || submitting || !localClients.length}>
          <option value="">(Select)</option>
          {localClients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </Select>
        <Input label="Subtotal" type="number" value={String(subtotal)} onChange={(e) => setSubtotal(Number((e.target as HTMLInputElement).value) || 0)} />
        <Input label="VAT (5%)" type="number" value={String(vat)} onChange={() => {}} disabled />
        <Input label="Total" type="number" value={String(total)} onChange={() => {}} disabled error={totalError} />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Pending">Pending</option>
          <option value="Received">Received</option>
        </Select>
        <Input label="Items JSON (optional)" value={itemsJson} onChange={(e) => setItemsJson((e.target as HTMLInputElement).value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={async () => {
              setSubmitting(true);
              try {
                const raw = itemsJson ? JSON.parse(itemsJson) : {};
                const companyName = companies.find((c) => c.id === companyId)?.name || '';
                const items = { ...raw, company: companyName, subject: subject || undefined };
                await onSubmit({ projectId, invoice_no: invoiceNo || undefined, invoice_date: invoiceDate, due_date: dueDate || undefined, items_json: items, subtotal, vat, total, status });
              } catch {
                window.alert('Invalid items JSON');
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!canSave || submitting}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

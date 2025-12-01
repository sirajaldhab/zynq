import React from 'react';
import { IonPage, IonContent, IonIcon, useIonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import { chevronBackOutline } from 'ionicons/icons';
import BulkImportModal from '../../ui/BulkImportModal';
import AdvancedTable, { AdvColumn, SortState } from '../../ui/AdvancedTable';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Modal from '../../ui/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { bulkCreateExpenses, fetchExpenses, ExpenseDto, updateExpense, deleteExpense } from '../../api/financeService';
import { fetchDocumentCompanies, DocumentCompanyDto } from '../../api/documentsService';
import { useAuth } from '../../auth/AuthContext';

type ImportRow = {
  id?: string;
  sn: number;
  company: string;
  date: string;
  invNo: string;
  trnNumber: string;
  description: string;
  supplier: string;
  unit: string;
  qty: number;
  amount: number;
  vat5: number;
  discount?: number;
  totalAmount: number;
  source: 'Existing' | 'Imported';
  _row?: number;
  _err?: string;
};

function parseNoteDetails(note?: string) {
  const result: {
    invNo?: string;
    trnNumber?: string;
    company?: string;
    supplier?: string;
    unit?: string;
    qty?: number;
    amount?: number;
    vat5?: number;
    discount?: number;
  } = {};
  if (!note) return result;
  const parts = note.split(';');
  for (const raw of parts) {
    const [k, ...rest] = raw.split(':');
    if (!k || !rest.length) continue;
    const key = k.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (!value) continue;
    switch (key) {
      case 'inv':
        result.invNo = value; break;
      case 'trn':
        result.trnNumber = value; break;
      case 'company':
        result.company = value; break;
      case 'supplier':
        result.supplier = value; break;
      case 'unit':
        result.unit = value; break;
      case 'qty':
        result.qty = Number(value) || undefined; break;
      case 'amount':
        result.amount = Number(value) || undefined; break;
      case 'vat':
      case 'vat5':
        result.vat5 = Number(value) || undefined; break;
      case 'discount':
        result.discount = Number(value) || undefined; break;
      default:
        break;
    }
  }
  return result;
}

export default function ExpensePage() {
  const navigate = useNavigate();
  const [present] = useIonToast();
  const { role } = useAuth();
  const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [tableRows, setTableRows] = React.useState<ImportRow[]>([]);
  const [sort, setSort] = React.useState<SortState | null>(null);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [loading, setLoading] = React.useState(false);
  const [editRow, setEditRow] = React.useState<ImportRow | null>(null);
  const [search, setSearch] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [supplierFilter, setSupplierFilter] = React.useState('');
  const [companyFilter, setCompanyFilter] = React.useState('');
  const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
  const [companies, setCompanies] = React.useState<DocumentCompanyDto[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState('');
  const [pendingImportRows, setPendingImportRows] = React.useState<Record<string, any>[]>([]);

  const loadExisting = React.useCallback(async () => {
    const token = localStorage.getItem('token') || undefined;
    try {
      setLoading(true);
      const res = await fetchExpenses({ page: 1, pageSize: 500, token });
      const data = ((res as any).rows ?? (res as any).data ?? []) as ExpenseDto[];

      const mapped: ImportRow[] = data.map((e, idx) => {
        const parsed = parseNoteDetails(e.note);
        const qty = parsed.qty ?? 1;
        const amount = parsed.amount ?? e.amount;
        const vat5 = parsed.vat5 ?? 0;
        const discount = parsed.discount ?? 0;
        const totalAmount = amount + vat5 - discount;
        return {
          id: e.id,
          sn: idx + 1,
          company: parsed.company || '',
          date: e.date?.substring(0, 10) || '',
          invNo: parsed.invNo || '',
          trnNumber: parsed.trnNumber || '',
          description: e.category || e.note || '',
          supplier: parsed.supplier || '',
          unit: parsed.unit || '',
          qty,
          amount,
          vat5,
          discount,
          totalAmount,
          source: 'Existing',
        };
      });

      setTableRows(mapped);
    } catch (err) {
      console.error('Failed to load existing expenses for Expense page', err);
      present({ message: 'Failed to load existing expenses', color: 'danger', duration: 1800, position: 'top' });
    } finally {
      setLoading(false);
    }
  }, [present]);

  const loadCompanies = React.useCallback(async () => {
    const token = localStorage.getItem('token') || undefined;
    try {
      const res = await fetchDocumentCompanies({ page: 1, pageSize: 200, token });
      setCompanies(res.data || []);
    } catch {
      setCompanies([]);
    }
  }, []);

  React.useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  React.useEffect(() => {
    if (!companies.length) {
      loadCompanies();
    }
  }, [companies.length, loadCompanies]);

  const supplierOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of tableRows) {
      if (r.supplier) set.add(r.supplier);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tableRows]);

  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return tableRows.filter((r) => {
      if (dateFrom && r.date && r.date < dateFrom) return false;
      if (dateTo && r.date && r.date > dateTo) return false;
      if (companyFilter && r.company !== companyFilter) return false;
      if (supplierFilter && r.supplier !== supplierFilter) return false;

      if (q) {
        const haystack = [
          r.sn,
          r.date,
          r.invNo,
          r.trnNumber,
          r.description,
          r.supplier,
          r.unit,
          r.qty,
          r.amount,
          r.vat5,
          r.discount,
          r.totalAmount,
          r.source,
          r.company,
        ]
          .map((v) => (v === undefined || v === null ? '' : String(v)))
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tableRows, search, dateFrom, dateTo, supplierFilter, companyFilter]);

  const summary = React.useMemo(() => {
    let amountTotal = 0;
    let vatTotal = 0;
    let discountTotal = 0;
    let grandTotal = 0;

    for (const r of filteredRows) {
      amountTotal += r.amount || 0;
      vatTotal += r.vat5 || 0;
      discountTotal += r.discount || 0;
      grandTotal += r.totalAmount || 0;
    }

    return { amount: amountTotal, vat: vatTotal, discount: discountTotal, totalAmount: grandTotal };
  }, [filteredRows]);

  const sortedRows = React.useMemo(() => {
    if (!sort) return filteredRows;
    const key = String(sort.key) as keyof ImportRow;
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      const av = (a as any)[key];
      const bv = (b as any)[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredRows, sort]);

  const pagedRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page]);

  const columns: AdvColumn<ImportRow>[] = [
    { key: 'company', header: 'Company', sortable: true },
    { key: 'sn', header: 'S/N', width: '60px', sortable: true },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'invNo', header: 'Inv NO', sortable: true },
    { key: 'trnNumber', header: 'T.R.N Number', sortable: true },
    { key: 'description', header: 'Description', sortable: true },
    { key: 'supplier', header: 'Supplier', sortable: true },
    { key: 'unit', header: 'Unit' },
    { key: 'qty', header: 'Qty.', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true },
    { key: 'vat5', header: '5% Vat', sortable: true },
    { key: 'discount', header: 'Discount', sortable: true },
    { key: 'totalAmount', header: 'Total Amount', sortable: true },
    {
      key: 'source',
      header: 'Source',
      render: (row) => (
        <span
          className={
            row.source === 'Existing'
              ? 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-[color:var(--surface)] text-[color:var(--text-secondary)]'
              : 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
          }
        >
          {row.source}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {!isTeamLeader && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditRow(row);
                }}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!row.id) {
                    present({ message: 'Cannot delete row without ID', color: 'danger', duration: 1600, position: 'top' });
                    return;
                  }
                  const ok = window.confirm('Are you sure you want to delete this expense?');
                  if (!ok) return;
                  const token = localStorage.getItem('token') || undefined;
                  try {
                    setLoading(true);
                    await deleteExpense({ id: row.id, token });
                    present({ message: 'Expense deleted', color: 'success', duration: 1600, position: 'top' });
                    await loadExisting();
                  } catch (err) {
                    console.error('Delete expense failed', err);
                    present({ message: 'Delete failed', color: 'danger', duration: 1800, position: 'top' });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  async function handleConfirmImport(rows: Record<string, any>[]) {
    if (!rows.length) {
      present({ message: 'No valid rows to import', color: 'warning', duration: 1800, position: 'top' });
      return;
    }

    setPendingImportRows(rows);
    setSelectedCompanyId('');
    if (!companies.length) {
      await loadCompanies();
    }
    setCompanyModalOpen(true);
  }

  async function handleConfirmImportWithCompany() {
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

    const mapped: ImportRow[] = pendingImportRows.map((r, idx) => {
      const sn = Number(r.sn ?? idx + 1);
      const date = String(r.date ?? '');
      const invNo = String(r.invNo ?? '');
      const trnNumber = String(r.trnNumber ?? '');
      const description = String(r.description ?? '');
      const supplier = String(r.supplier ?? '');
      const unit = String(r.unit ?? '');
      const qty = Number(r.qty ?? 0);
      const amount = Number(r.amount ?? 0);
      const vat5 = Number(r.vat5 ?? 0);
      const discount = r.discount !== undefined ? Number(r.discount ?? 0) : undefined;
      const totalAmount = Number(r.totalAmount ?? 0);
      return { sn, company: companyName, date, invNo, trnNumber, description, supplier, unit, qty, amount, vat5, discount, totalAmount, source: 'Imported' };
    });

    try {
      await bulkCreateExpenses(
        mapped.map((m) => ({
          date: m.date,
          amount: m.totalAmount || m.amount,
          category: m.description || 'Expense',
          note: `Company:${m.company}; Inv:${m.invNo}; TRN:${m.trnNumber}; Supplier:${m.supplier}; Unit:${m.unit}; Qty:${m.qty}; Amount:${m.amount}; VAT:${m.vat5}; Discount:${m.discount ?? ''}`,
          token,
        })) as any,
      );
      setCompanyModalOpen(false);
      setPendingImportRows([]);
      await loadExisting();
      present({ message: `Imported ${mapped.length} rows`, color: 'success', duration: 1800, position: 'top' });
    } catch (e) {
      console.error('Expense import failed', e);
      present({ message: 'Import failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)] py-8">
        <div className="space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold hidden lg:block">Finance / Expenses / Expense</div>
          <div className="zynq-muted text-sm hidden lg:block">Home &gt; Finance &gt; Expenses &gt; Expense</div>

          <div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 flex items-center gap-2"
              onClick={() => navigate('/finance/expenses')}
            >
              <IonIcon icon={chevronBackOutline} />
              <span>Back</span>
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Amount</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {summary.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>VAT</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {summary.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Discount</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {summary.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Amount</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {summary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-base font-semibold">Import from Excel</div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPreviewOpen(true)}
              >
                Import from Excel
              </Button>
            </div>

            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  label="Search"
                  placeholder="Search expenses"
                  value={search}
                  onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
                />
                <Input
                  label="From"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom((e.target as HTMLInputElement).value)}
                />
                <Input
                  label="To"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo((e.target as HTMLInputElement).value)}
                />
                <Select
                  label="Company"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                >
                  <option value="">All companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div />
                <div />
                <div />
                <Select
                  label="Supplier"
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                >
                  <option value="">All suppliers</option>
                  {supplierOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <AdvancedTable<ImportRow>
                columns={columns}
                data={pagedRows}
                loading={loading}
                page={page}
                pageSize={pageSize}
                total={filteredRows.length}
                sort={sort}
                onSortChange={(s) => setSort(s)}
                onPageChange={(p) => setPage(p)}
                emptyText="No imported expenses yet"
                headerClassName="bg-[color:var(--muted)]"
              />
            </div>
          </div>

          <BulkImportModal
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            fields={[
              { key: 'sn', label: 'S/N', required: true },
              { key: 'date', label: 'Date', required: true },
              { key: 'invNo', label: 'Inv NO', required: true },
              { key: 'trnNumber', label: 'T.R.N Number', required: true },
              { key: 'description', label: 'Description', required: true },
              { key: 'supplier', label: 'Supplier', required: true },
              { key: 'unit', label: 'Unit', required: true },
              { key: 'qty', label: 'Qty.', required: true },
              { key: 'amount', label: 'Amount', required: true },
              { key: 'vat5', label: '5% Vat', required: true },
              { key: 'discount', label: 'Discount', required: false },
              { key: 'totalAmount', label: 'Total Amount', required: true },
            ]}
            onValidate={(row) => {
              const missing: string[] = [];
              const mustHave = ['sn', 'date', 'invNo', 'trnNumber', 'description', 'supplier', 'unit', 'qty', 'amount', 'vat5', 'totalAmount'];
              for (const key of mustHave) {
                if (row[key] === undefined || row[key] === null || row[key] === '') {
                  missing.push(key);
                }
              }
              if (row.qty !== undefined && !(Number(row.qty) > 0)) missing.push('qty');
              if (row.amount !== undefined && !(Number(row.amount) >= 0)) missing.push('amount');
              if (row.totalAmount !== undefined && !(Number(row.totalAmount) >= 0)) missing.push('totalAmount');
              return missing.length ? `Missing/invalid: ${missing.join(', ')}` : undefined;
            }}
            onConfirm={handleConfirmImport}
            templateHint="Expected columns: S/N, Date, Inv NO, T.R.N Number, Description, Supplier, Unit, Qty., Amount, 5% Vat, Discount, Total Amount"
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
                <Button onClick={handleConfirmImportWithCompany} disabled={!selectedCompanyId}>
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
        </div>
      </IonContent>
      {editRow ? (
        <EditExpenseModal
          row={editRow}
          companies={companies}
          onClose={() => setEditRow(null)}
          onSubmit={async (updated) => {
            if (!editRow.id) {
              present({ message: 'Cannot edit row without ID', color: 'danger', duration: 1600, position: 'top' });
              return;
            }
            const ok = window.confirm('Save changes to this expense?');
            if (!ok) return;
            const token = localStorage.getItem('token') || undefined;
            try {
              setLoading(true);
              const amount = updated.totalAmount ?? updated.amount;
              await updateExpense(
                { id: editRow.id, token },
                {
                  date: updated.date,
                  amount,
                  category: updated.description,
                  note: `Company:${updated.company}; Inv:${updated.invNo}; TRN:${updated.trnNumber}; Supplier:${updated.supplier}; Unit:${updated.unit}; Qty:${updated.qty}; Amount:${updated.amount}; VAT:${updated.vat5}; Discount:${updated.discount ?? ''}`,
                },
              );
              present({ message: 'Expense updated', color: 'success', duration: 1600, position: 'top' });
              setEditRow(null);
              await loadExisting();
            } catch (err) {
              console.error('Update expense failed', err);
              present({ message: 'Update failed', color: 'danger', duration: 1800, position: 'top' });
            } finally {
              setLoading(false);
            }
          }}
        />
      ) : null}
    </IonPage>
  );
}

function EditExpenseModal({ row, companies, onClose, onSubmit }: { row: ImportRow; companies: DocumentCompanyDto[]; onClose: () => void; onSubmit: (updated: ImportRow) => void | Promise<void> }) {
  const [form, setForm] = React.useState<ImportRow>(row);
  React.useEffect(() => { setForm(row); }, [row]);

  function update<K extends keyof ImportRow>(key: K, value: ImportRow[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSave = !!form.date && !!form.description && form.totalAmount >= 0;

  const { role } = useAuth();
  const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';

  return (
    <Modal open={true} onClose={onClose} title="Edit Expense">
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        <Select
          label="Company"
          value={form.company}
          onChange={(e) => update('company', (e.target as HTMLSelectElement).value)}
        >
          <option value="">Select company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input label="Date" type="date" value={form.date} onChange={(e) => update('date', (e.target as HTMLInputElement).value)} />
        <Input label="Inv NO" value={form.invNo} onChange={(e) => update('invNo', (e.target as HTMLInputElement).value)} />
        <Input label="T.R.N Number" value={form.trnNumber} onChange={(e) => update('trnNumber', (e.target as HTMLInputElement).value)} />
        <Input label="Description" value={form.description} onChange={(e) => update('description', (e.target as HTMLInputElement).value)} />
        <Input label="Supplier" value={form.supplier} onChange={(e) => update('supplier', (e.target as HTMLInputElement).value)} />
        <Input label="Unit" value={form.unit} onChange={(e) => update('unit', (e.target as HTMLInputElement).value)} />
        <Input label="Qty" type="number" value={String(form.qty)} onChange={(e) => update('qty', Number((e.target as HTMLInputElement).value) || 0)} />
        <Input label="Amount" type="number" value={String(form.amount)} onChange={(e) => update('amount', Number((e.target as HTMLInputElement).value) || 0)} />
        <Input label="5% Vat" type="number" value={String(form.vat5)} onChange={(e) => update('vat5', Number((e.target as HTMLInputElement).value) || 0)} />
        <Input label="Discount" type="number" value={String(form.discount ?? 0)} onChange={(e) => update('discount', Number((e.target as HTMLInputElement).value) || 0)} />
        <Input label="Total Amount" type="number" value={String(form.totalAmount)} onChange={(e) => update('totalAmount', Number((e.target as HTMLInputElement).value) || 0)} />
        <div className="flex justify-end gap-2 mt-4">
          {!isTeamLeader && (
            <>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={() => onSubmit(form)} disabled={!canSave}>Save</Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

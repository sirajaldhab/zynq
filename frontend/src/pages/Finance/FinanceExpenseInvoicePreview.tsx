import React, { useEffect, useState, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table, { Column } from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { useNavigate } from 'react-router-dom';
import { fetchExpenses } from '../../api/financeService';

type ExpenseInvoiceRow = {
  id: string;
  company: string;
  date: string;
  description: string;
  supplier: string;
  totalAmount: number;
};

const columns: Column<ExpenseInvoiceRow>[] = [
  { key: 'company', header: 'Company' },
  {
    key: 'date',
    header: 'Date',
    render: (r) => (r.date ? new Date(r.date).toLocaleDateString() : ''),
  },
  { key: 'description', header: 'Description' },
  { key: 'supplier', header: 'Supplier' },
  {
    key: 'totalAmount',
    header: 'Total Amount',
    render: (r) => r.totalAmount.toLocaleString(),
  },
];

export default function FinanceExpenseInvoicePreviewPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ExpenseInvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') || undefined;
      try {
        setLoading(true);
        const res = await fetchExpenses({ page: 1, pageSize: 1000, token } as any);
        const data = ((res as any).rows ?? (res as any).data ?? []) as any[];
        const mapped: ExpenseInvoiceRow[] = data.map((e: any, idx: number) => {
          const note: string = e.note || '';
          const parts = note.split(';');
          const get = (key: string) => {
            const p = parts.find((s) => s.trim().toLowerCase().startsWith(key));
            if (!p) return '';
            return p.split(':').slice(1).join(':').trim();
          };
          const company = get('company');
          const supplier = get('supplier');
          const description = e.category || e.note || '';
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
            id: e.id || String(idx),
            company,
            date: (e.date || '').slice(0, 10),
            description,
            supplier,
            totalAmount,
          };
        });
        setRows(mapped);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const viewRows = useMemo(() => rows, [rows]);

  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Finance / Expense Invoice (Read Only)</div>
            <div className="zynq-muted text-sm">Home &gt; Finance &gt; Expense Invoice Preview</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/finance')}>
            Back to Finance
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Expense Invoice (All)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<ExpenseInvoiceRow>
              columns={columns}
              data={viewRows}
              emptyText="No expense invoices"
            />
          </CardContent>
        </Card>
      </IonContent>
    </IonPage>
  );
}

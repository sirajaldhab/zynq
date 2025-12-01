import React, { useEffect, useState, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table, { Column } from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { useNavigate } from 'react-router-dom';
import { fetchGeneralExpenses } from '../../api/financeService';

type GeneralRow = {
  id: string;
  company: string;
  date: string;
  invNo: string;
  description: string;
  supplier: string;
  totalAmount: number;
};

const columns: Column<GeneralRow>[] = [
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
    render: (r) =>
      r.totalAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
  },
];

export default function FinanceGeneralExpensePreviewPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<GeneralRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') || undefined;
      try {
        setLoading(true);
        const res = await fetchGeneralExpenses({ page: 1, pageSize: 1000, token } as any);
        const data = ((res as any).rows ?? (res as any).data ?? []) as any[];
        const mapped: GeneralRow[] = data.map((e: any, idx: number) => {
          const note = e.note || '';
          const parts = note.split(';');
          const get = (key: string) => {
            const p = parts.find((s: string) => s.trim().toLowerCase().startsWith(key));
            if (!p) return '';
            return p.split(':').slice(1).join(':').trim();
          };
          const invNo = get('inv');
          const supplier = get('supplier');
          const company = get('company');
          const totalAmountNote = get('totalamount');
          const totalFromNote = totalAmountNote ? Number(totalAmountNote) : undefined;
          const totalAmount =
            (Number.isFinite(totalFromNote as any)
              ? (totalFromNote as number)
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
            <div className="text-lg font-semibold">Finance / General Expenses (Read Only)</div>
            <div className="zynq-muted text-sm">Home &gt; Finance &gt; General Expenses Preview</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/finance')}>
            Back to Finance
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>General Expenses (All)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<GeneralRow>
              columns={columns}
              data={viewRows}
              emptyText="No general expenses"
            />
          </CardContent>
        </Card>
      </IonContent>
    </IonPage>
  );
}

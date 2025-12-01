import React, { useEffect, useState, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table, { Column } from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { useNavigate } from 'react-router-dom';
import { fetchExternalLabourExpenses } from '../../api/externalLabourExpenseService';

type ExternalRow = {
  id: string;
  supplier: string;
  month: string;
  paidAmount: number;
};

const columns: Column<ExternalRow>[] = [
  { key: 'supplier', header: 'Supplier' },
  { key: 'month', header: 'Month' },
  {
    key: 'paidAmount',
    header: 'Paid Amount',
    render: (r) =>
      r.paidAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
  },
];

export default function FinanceExternalLabourPreviewPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ExternalRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') || undefined;
      try {
        setLoading(true);
        const res = await fetchExternalLabourExpenses({ token } as any);
        const data = (res || []) as any[];
        const mapped: ExternalRow[] = data.map((row: any, idx: number) => ({
          id: row.id || String(idx),
          supplier:
            typeof row.supplier === 'object' && row.supplier !== null
              ? String((row.supplier as any).name || '')
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
            <div className="text-lg font-semibold">Finance / External Labour Expense (Read Only)</div>
            <div className="zynq-muted text-sm">Home &gt; Finance &gt; External Labour Expense Preview</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/finance')}>
            Back to Finance
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>External Labour Expense (All)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<ExternalRow>
              columns={columns}
              data={viewRows}
              emptyText="No external labour expenses"
            />
          </CardContent>
        </Card>
      </IonContent>
    </IonPage>
  );
}

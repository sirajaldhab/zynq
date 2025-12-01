import React, { useEffect, useState, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table, { Column } from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { useNavigate } from 'react-router-dom';
import { fetchInvoices } from '../../api/financeService';

type InvoiceRow = {
  id: string;
  number: string;
  client: string;
  date: string;
  amount: number;
  status: string;
};

const columns: Column<InvoiceRow>[] = [
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
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') || undefined;
      try {
        setLoading(true);
        const res = await fetchInvoices({
          status: 'All' as any,
          search: '',
          page: 1,
          pageSize: 1000,
          token,
        } as any);
        const data = ((res as any).rows ?? (res as any).data ?? []) as any[];
        const mapped: InvoiceRow[] = data.map((r: any) => ({
          id: r.id,
          number: r.invoice_no || r.number || r.id,
          client: r.client?.name || r.clientName || r.client || r.clientId || '',
          date: (r.invoice_date || r.date || '').slice(0, 10),
          amount: Number(r.total ?? r.subtotal ?? r.amount ?? 0) || 0,
          status: (r.status as any) || 'Pending',
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
            <div className="text-lg font-semibold">Finance / Invoices (Read Only)</div>
            <div className="zynq-muted text-sm">Home &gt; Finance &gt; Invoices Preview</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/finance')}>
            Back to Finance
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoices (All)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<InvoiceRow>
              columns={columns}
              data={viewRows}
              emptyText="No invoices"
            />
          </CardContent>
        </Card>
      </IonContent>
    </IonPage>
  );
}

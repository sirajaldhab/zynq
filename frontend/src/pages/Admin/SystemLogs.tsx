import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import { useQueryParam } from '../../hooks/useQueryParam';
import Table, { Column } from '../../ui/Table';
import Input from '../../ui/Input';
import Pagination from '../../ui/Pagination';
import { fetchSystemLogs, SystemLogDto } from '../../api/adminService';

export default function AdminSystemLogs() {
  const [present] = useIonToast();
  const [level, setLevel] = useQueryParam<string>('level', '');
  const [page, setPage] = useQueryParam<number>('page', 1);
  const pageSize = 20;
  const [rows, setRows] = React.useState<SystemLogDto[]>([]);
  const [total, setTotal] = React.useState(0);

  const columns: Column<SystemLogDto>[] = [
    { key: 'created_at', header: 'Time', render: (r) => new Date(r.created_at).toLocaleString() },
    { key: 'level', header: 'Level' },
    { key: 'message', header: 'Message' },
    { key: 'context_json', header: 'Context', render: (r) => (r.context_json || '').slice(0, 60) },
  ];

  async function load() {
    const token = localStorage.getItem('token') || undefined;
    try {
      const res = await fetchSystemLogs({ page, pageSize, level: level || undefined, token });
      setRows(res.data);
      setTotal(res.total ?? res.data.length);
    } catch (e) {
      present({ message: 'Failed to load logs', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, page]);

  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Admin / System Logs</div>
        <div className="zynq-muted text-sm">Home &gt; Admin &gt; System Logs</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <Input label="Level" placeholder="INFO/WARN/ERROR" value={level} onChange={(e) => setLevel((e.target as HTMLInputElement).value)} />
        </div>
        <Table columns={columns} data={rows} emptyText="No logs" />
        <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
      </IonContent>
    </IonPage>
  );
}

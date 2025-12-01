import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import Table, { Column } from '../../ui/Table';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { fetchAppSettings, updateAppSetting, AppSettingDto } from '../../api/adminService';

export default function AdminAppSettings() {
  const [present] = useIonToast();
  const [rows, setRows] = React.useState<AppSettingDto[]>([]);
  const [editing, setEditing] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});

  const columns: Column<AppSettingDto>[] = [
    { key: 'key', header: 'Key' },
    {
      key: 'value',
      header: 'Value',
      render: (r) => (
        <div className="flex gap-2 items-center">
          <Input value={editing[r.key] ?? r.value} onChange={(e) => setEditing((s) => ({ ...s, [r.key]: (e.target as HTMLInputElement).value }))} />
          <Button size="sm" onClick={() => onSave(r.key)} disabled={!!saving[r.key]}>Save</Button>
        </div>
      ),
    },
  ];

  async function load() {
    const token = localStorage.getItem('token') || undefined;
    try {
      const data = await fetchAppSettings({ token });
      setRows(data);
      setEditing({});
    } catch (e) {
      present({ message: 'Failed to load settings', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  React.useEffect(() => { load(); }, []);

  async function onSave(key: string) {
    const token = localStorage.getItem('token') || undefined;
    try {
      const value = (editing[key] ?? rows.find((r) => r.key === key)?.value ?? '').trim();
      if (!value) {
        present({ message: 'Value cannot be empty', color: 'warning', duration: 1500, position: 'top' });
        return;
      }
      setSaving((s) => ({ ...s, [key]: true }));
      await updateAppSetting({ key, token }, { value });
      present({ message: 'Setting updated', color: 'success', duration: 1200, position: 'top' });
      load();
    } catch (e) {
      present({ message: 'Update failed', color: 'danger', duration: 2000, position: 'top' });
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">Admin / App Settings</div>
        <div className="zynq-muted text-sm">Home &gt; Admin &gt; App Settings</div>
        <Table columns={columns} data={rows} emptyText="No settings" />
      </IonContent>
    </IonPage>
  );
}

import React from 'react';
import { IonPage, IonContent, IonIcon, useIonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table, { Column } from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Input from '../../ui/Input';
import Modal from '../../ui/Modal';
import { chevronBackOutline } from 'ionicons/icons';
import { fetchVendors, createVendor, updateVendor, deleteVendor, VendorDto } from '../../api/vendorsService';
import { fetchManpowerRecords, ManpowerRecordDto } from '../../api/manpowerRecordsService';
import { useAuth } from '../../auth/AuthContext';

type Supplier = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  totalLabour: number;
  total: number;
};

type MonthlySummaryRow = {
  monthLabel: string; // e.g. "January 2025"
  monthKey: string;   // e.g. "2025-01"
  supplierId: string;
  supplierName: string;
  totalLabour: number;
  total: number;
};

export default function HRAttendanceManpowerSupplier() {
  const navigate = useNavigate();
  const [present] = useIonToast();
  const { role } = useAuth();
  const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [monthlySummaries, setMonthlySummaries] = React.useState<MonthlySummaryRow[]>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [editing, setEditing] = React.useState<Supplier | null>(null);
  const [formName, setFormName] = React.useState('');
  const [formContact, setFormContact] = React.useState('');
  const [formPhone, setFormPhone] = React.useState('');
  const [errors, setErrors] = React.useState<{ name?: string; contactPerson?: string }>({});

  React.useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    (async () => {
      try {
        // Load suppliers
        const res = await fetchVendors({ token });

        // Load all manpower records once for this page so we can aggregate totals per supplier
        // and build a monthly summary that matches the Add Records data source.
        const recordsRes = await fetchManpowerRecords({ token });
        const records: ManpowerRecordDto[] = recordsRes || [];

        // Aggregate overall totals by vendorId so we never mix data between suppliers.
        const totalsByVendor = new Map<string, { totalLabour: number; total: number }>();
        for (const r of records) {
          const key = (r.vendorId || '').trim();
          if (!key) continue;
          const entry = totalsByVendor.get(key) || { totalLabour: 0, total: 0 };
          entry.totalLabour += Number(r.totalLabour || 0);
          entry.total += Number(r.total || 0);
          totalsByVendor.set(key, entry);
        }

        const mapped: Supplier[] = (res || []).map((v: VendorDto) => {
          const contact = v.contact || '';
          const [person, phone] = contact.split('|');
          const totals = totalsByVendor.get(v.id) || { totalLabour: 0, total: 0 };
          return {
            id: v.id,
            name: v.name,
            contactPerson: person || '',
            phone: phone || '',
            totalLabour: totals.totalLabour,
            total: totals.total,
          };
        });
        setSuppliers(mapped);

        // Build monthly summary per supplier + calendar month
        const monthlyMap = new Map<string, MonthlySummaryRow>();

        for (const r of records) {
          const vendorId = (r.vendorId || '').trim();
          if (!vendorId) continue;

          const vendor = (res || []).find((v: VendorDto) => v.id === vendorId);
          const supplierName = vendor?.name || vendorId;

          const rawDate = (r as any).date || r.createdAt;
          if (!rawDate) continue;

          const d = new Date(rawDate as any);
          if (Number.isNaN(d.getTime())) continue;

          const year = d.getFullYear();
          const monthIndex = d.getMonth(); // 0-11
          const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`; // e.g. 2025-01
          const monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });

          const key = `${monthKey}__${vendorId}`;
          let row = monthlyMap.get(key);
          if (!row) {
            row = {
              monthLabel,
              monthKey,
              supplierId: vendorId,
              supplierName,
              totalLabour: 0,
              total: 0,
            };
            monthlyMap.set(key, row);
          }

          row.totalLabour += Number(r.totalLabour || 0);
          row.total += Number(r.total || 0);
        }

        const monthlyList = Array.from(monthlyMap.values());

        // Sort by month descending, then supplier name
        monthlyList.sort((a, b) => {
          if (a.monthKey !== b.monthKey) return a.monthKey < b.monthKey ? 1 : -1;
          return a.supplierName.localeCompare(b.supplierName);
        });

        setMonthlySummaries(monthlyList);
      } catch (e: any) {
        setSuppliers([]);
        present({ message: 'Failed to load suppliers.', color: 'danger', duration: 1800, position: 'top' });
      }
    })();
  }, []);

  function resetForm() {
    setFormName('');
    setFormContact('');
    setFormPhone('');
    setErrors({});
  }

  const columns: Column<Supplier>[] = [
    { key: 'name', header: 'Supplier Name' },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'totalLabour',
      header: 'Total Labour',
      render: (row) => Number(row.totalLabour || 0).toLocaleString(),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => Number(row.total || 0).toLocaleString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {!isTeamLeader && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditing(row);
                  setFormName(row.name);
                  setFormContact(row.contactPerson);
                  setFormPhone(row.phone);
                  setErrors({});
                  setAddOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  if (busy) return;
                  if (!window.confirm('Are you sure?')) return;
                  const token = localStorage.getItem('token') || undefined;
                  try {
                    await deleteVendor({ id: row.id, token });
                    setSuppliers((prev) => prev.filter((s) => s.id !== row.id));
                    present({ message: 'Supplier deleted.', color: 'success', duration: 1500, position: 'top' });
                  } catch {
                    present({ message: 'Failed to delete supplier.', color: 'danger', duration: 2000, position: 'top' });
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

  const monthlyColumns: Column<MonthlySummaryRow>[] = [
    { key: 'monthLabel', header: 'Month', render: (row) => row.monthLabel },
    { key: 'supplierName', header: 'Manpower Supplier', render: (row) => row.supplierName },
    {
      key: 'totalLabour',
      header: 'Total Labour',
      render: (row) => Number(row.totalLabour || 0).toLocaleString(),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => Number(row.total || 0).toLocaleString(),
    },
  ];

  async function handleCreateSupplier() {
    const nextErrors: { name?: string; contactPerson?: string } = {};
    if (!formName.trim()) nextErrors.name = 'Supplier Name is required';
    if (!formContact.trim()) nextErrors.contactPerson = 'Contact Person is required';
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.contactPerson) {
      present({ message: 'Please fill in all required fields.', color: 'danger', duration: 1800, position: 'top' });
      return;
    }

    setBusy(true);
    const token = localStorage.getItem('token') || undefined;
    try {
      const combinedContact = formPhone.trim()
        ? `${formContact.trim()}|${formPhone.trim()}`
        : formContact.trim();

      if (editing) {
        const dto = await updateVendor(
          { id: editing.id, token },
          { name: formName.trim(), contact: combinedContact },
        );
        const updated: Supplier = {
          id: dto.id,
          name: dto.name,
          contactPerson: (dto.contact || '').split('|')[0] || '',
          phone: (dto.contact || '').split('|')[1] || '',
          totalLabour: editing.totalLabour,
          total: editing.total,
        };
        setSuppliers((prev) => prev.map((s) => (s.id === editing.id ? updated : s)));
        present({ message: 'Supplier updated.', color: 'success', duration: 1500, position: 'top' });
      } else {
        const dto = await createVendor({
          name: formName.trim(),
          contact: combinedContact,
          token,
        });
        const created: Supplier = {
          id: dto.id,
          name: dto.name,
          contactPerson: (dto.contact || '').split('|')[0] || '',
          phone: (dto.contact || '').split('|')[1] || '',
          totalLabour: 0,
          total: 0,
        };
        setSuppliers((prev) => [created, ...prev]);
        present({ message: 'Supplier added.', color: 'success', duration: 1500, position: 'top' });
      }

      setAddOpen(false);
      setEditing(null);
      resetForm();
    } catch {
      present({ message: editing ? 'Failed to update supplier.' : 'Failed to add supplier.', color: 'danger', duration: 2000, position: 'top' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="px-4 py-8 sm:px-6 lg:px-8 bg-[color:var(--bg)] space-y-4">
        <div className="text-lg font-semibold">HR / Attendance / Manpower Supplier</div>
        <div className="zynq-muted text-sm">Home &gt; HR &gt; Attendance &gt; Manpower Supplier</div>

        <div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 flex items-center gap-2"
            onClick={() => navigate('/hr/attendance')}
          >
            <IonIcon icon={chevronBackOutline} />
            <span>Back</span>
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="text-base font-semibold">Manpower Suppliers</div>
            <Button
              size="sm"
              variant="secondary"
              className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
              onClick={() => navigate('/hr/attendance/manpower-supplier/add-records')}
            >
              Add Records
            </Button>
          </div>
          {!isTeamLeader && (
            <Button
              size="sm"
              className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
              onClick={() => { resetForm(); setEditing(null); setAddOpen(true); }}
            >
              Add Supplier
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<Supplier> columns={columns} data={suppliers} emptyText="No suppliers" />
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<MonthlySummaryRow>
              columns={monthlyColumns}
              data={monthlySummaries}
              emptyText="No monthly summary data"
            />
          </CardContent>
        </Card>

        <Modal
          open={addOpen}
          onClose={() => { if (!busy) { setAddOpen(false); setEditing(null); resetForm(); } }}
          title={editing ? 'Edit Supplier' : 'Add Supplier'}
        >
          <div className="space-y-3">
            <div>
              <Input
                label="Supplier Name"
                value={formName}
                onChange={(e: any) => setFormName(e.target.value)}
                disabled={isTeamLeader}
              />
              {errors.name && (
                <div className="mt-1 text-xs text-[color:var(--danger)]">{errors.name}</div>
              )}
            </div>
            <div>
              <Input
                label="Contact Person"
                value={formContact}
                onChange={(e: any) => setFormContact(e.target.value)}
                disabled={isTeamLeader}
              />
              {errors.contactPerson && (
                <div className="mt-1 text-xs text-[color:var(--danger)]">{errors.contactPerson}</div>
              )}
            </div>
            <div>
              <Input
                label="Phone"
                value={formPhone}
                onChange={(e: any) => setFormPhone(e.target.value)}
                disabled={isTeamLeader}
              />
            </div>
            {!isTeamLeader && (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => { if (!busy) { setAddOpen(false); setEditing(null); resetForm(); } }}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateSupplier} disabled={busy}>
                  Save
                </Button>
              </div>
            )}
          </div>
        </Modal>
      </IonContent>
    </IonPage>
  );
}

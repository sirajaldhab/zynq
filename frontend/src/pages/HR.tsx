import React, { useMemo, useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonToast, IonButton, IonSpinner, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Table, { Column } from '../ui/Table';
import Pagination from '../ui/Pagination';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { toCsv, downloadCsv, CsvColumn } from '../utils/csv';
import { useQueryParam } from '../hooks/useQueryParam';
import { fetchAttendance, AttendanceDto } from '../api/hrService';
import { chevronBackOutline } from 'ionicons/icons';

type Attendance = {
  id: string;
  date: string;
  employee: string;
  project: string;
  status: 'Present' | 'Absent' | 'Leave';
  checkIn?: string;
  checkOut?: string;
};

type AttendanceLogRow = {
  id: string;
  date: string; // YYYY-MM-DD
  employeeName: string;
  emiratesId: string;
  status: string;
  checkIn: string;
  checkOut: string;
  otHours: string;
  siteProject: string;
  approvedBy: string;
  signature: string;
};

const EMPLOYEES: string[] = [];
const PROJECTS: string[] = [];

export default function HR() {
  const [present] = useIonToast();
  const navigate = useNavigate();
  useEffect(() => {
    console.log('Loaded HR > Overview page');
  }, []);
  // Attendance state
  const [attSearch, setAttSearch] = useQueryParam<string>('attQ', '');
  const [attStatus, setAttStatus] = useQueryParam<'All' | Attendance['status']>('attStatus', 'All');
  const [attProject, setAttProject] = useQueryParam<'All' | string>('attProject', 'All');
  const [attPage, setAttPage] = useQueryParam<number>('attPage', 1);
  const [attEmployeeId, setAttEmployeeId] = useQueryParam<string>('attEmp', '');
  const [attStart, setAttStart] = useQueryParam<string>('attStart', '');
  const [attEnd, setAttEnd] = useQueryParam<string>('attEnd', '');
  const attPageSize = 8;
  const [attView, setAttView] = useState<Attendance | null>(null);
  const [attEdit, setAttEdit] = useState<Attendance | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [attendanceTotal, setAttendanceTotal] = useState<number>(0);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Read-only attendance logs grouped by date (for display only)
  const [logsByDate, setLogsByDate] = useState<Record<string, AttendanceLogRow[]>>({});
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsMonth, setLogsMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [logsStartDate, setLogsStartDate] = useState('');
  const [logsEndDate, setLogsEndDate] = useState('');
  const [logsProjectFilter, setLogsProjectFilter] = useState('');

  const filteredAttendance = useMemo(() => {
    const q = (attSearch || '').toString().toLowerCase();
    return attendance.filter((r) => {
      const employeeName = (r.employee || '').toString().toLowerCase();
      const projectName = (r.project || '').toString().toLowerCase();
      return (
        (attStatus === 'All' || r.status === attStatus) &&
        (attProject === 'All' || r.project === attProject) &&
        (employeeName.includes(q) || projectName.includes(q))
      );
    });
  }, [attendance, attSearch, attStatus, attProject]);

  function workedHours(r: Attendance) {
    if (!r.checkIn || !r.checkOut) return 0;
    const diffMs = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
    return Math.max(0, Math.round((diffMs / 36e5) * 10) / 10); // hours, 1 decimal
  }

  // Derived list of unique SITE / PROJECT values from current logs
  const logsProjectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(logsByDate)
            .flat()
            .map((r) => r.siteProject)
            .filter((v) => !!v),
        ),
      ).sort(),
    [logsByDate],
  );

  // Compute totals for the selected project across all dates
  const logsTotals = useMemo(() => {
    let totalRecords = 0;
    let totalOt = 0;
    const selectedProject = logsProjectFilter || '';

    Object.values(logsByDate).forEach((rows) => {
      rows.forEach((r) => {
        if (!selectedProject || r.siteProject === selectedProject) {
          totalRecords += 1;
          const ot = Number(r.otHours || '0');
          if (!Number.isNaN(ot)) totalOt += ot;
        }
      });
    });

    return { totalRecords, totalOt: Math.round(totalOt * 10) / 10 };
  }, [logsByDate, logsProjectFilter]);
  function overtimeHours(r: Attendance) {
    const h = workedHours(r);
    return h > 8 ? Math.round((h - 8) * 10) / 10 : 0;
  }

  const attTotals = useMemo(() => {
    const present = filteredAttendance.filter((r) => r.status === 'Present');
    const totalHours = present.reduce((s, r) => s + workedHours(r), 0);
    const overtime = present.reduce((s, r) => s + overtimeHours(r), 0);
    const rate = (present.length / Math.max(1, filteredAttendance.length)) * 100;
    return { totalHours: Math.round(totalHours * 10) / 10, overtime: Math.round(overtime * 10) / 10, rate: Math.round(rate) };
  }, [filteredAttendance]);

  const projectHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredAttendance) {
      if (r.status !== 'Present') continue;
      map.set(r.project, (map.get(r.project) || 0) + workedHours(r));
    }
    return Array.from(map.entries())
      .map(([project, hours]) => ({ project, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredAttendance]);

  // Exports
  function exportAttendanceCsv() {
    const cols: CsvColumn<Attendance>[] = [
      { key: 'date', header: 'Date', map: (r) => new Date(r.date).toISOString() },
      { key: 'employee', header: 'Employee' },
      { key: 'project', header: 'Project' },
      { key: 'status', header: 'Status' },
      { key: 'checkIn', header: 'In', map: (r) => (r.checkIn ? new Date(r.checkIn).toISOString() : '') },
      { key: 'checkOut', header: 'Out', map: (r) => (r.checkOut ? new Date(r.checkOut).toISOString() : '') },
      { key: 'hours', header: 'Hours', map: (r) => (r.status === 'Present' ? workedHours(r).toFixed(1) : '') },
      { key: 'overtime', header: 'OT', map: (r) => (r.status === 'Present' ? overtimeHours(r).toFixed(1) : '') },
    ];
    downloadCsv('attendance.csv', toCsv(filteredAttendance, cols));
  }

  const attendanceColumns: Column<Attendance>[] = [
    { key: 'date', header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { key: 'employee', header: 'Employee' },
    { key: 'project', header: 'Project' },
    { key: 'status', header: 'Status', render: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'Present' ? 'bg-green-500/10 text-green-500' : r.status === 'Absent' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>{r.status}</span>
    ) },
    { key: 'checkIn', header: 'In', render: (r) => (r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—') },
    { key: 'checkOut', header: 'Out', render: (r) => (r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—') },
    { key: 'hours', header: 'Hours', render: (r) => (r.status === 'Present' ? workedHours(r).toFixed(1) : '—') },
    { key: 'overtime', header: 'OT', render: (r) => (r.status === 'Present' ? overtimeHours(r).toFixed(1) : '—') },
    { key: 'actions', header: 'Actions', render: (r) => (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setAttView(r)}>View</Button>
        <Button size="sm" variant="secondary" onClick={() => setAttEdit(r)}>Edit</Button>
      </div>
    ) },
  ];

  const viewAttendance = filteredAttendance;

  React.useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    (async () => {
      try {
        setAttendanceLoading(true);
        const res = await fetchAttendance({
          search: attSearch,
          status: attStatus,
          project: attProject,
          employeeId: attEmployeeId || undefined,
          start: attStart || undefined,
          end: attEnd || undefined,
          page: attPage,
          pageSize: attPageSize,
          token,
        });
        const apiRows = (Array.isArray(res) ? res : (((res as any).data ?? (res as any).rows) || [])) as AttendanceDto[];
        const mapped: Attendance[] = apiRows.map((a: any) => {
          const employeeName =
            a.employeeName ??
            a.employee_name ??
            a.employee?.employeeName ??
            a.employee?.name ??
            a.employee ??
            '';
          const projectName =
            a.project ??
            a.projectName ??
            a.project_name ??
            '';
          const rawDate = a.date ?? a.check_in ?? a.checkIn;
          const dateStr =
            typeof rawDate === 'string'
              ? rawDate
              : rawDate
              ? new Date(rawDate).toISOString()
              : new Date().toISOString();

          return {
            id: a.id,
            date: dateStr,
            employee: String(employeeName ?? ''),
            project: String(projectName ?? ''),
            status: (a.status as any) ?? 'Present',
            checkIn: a.checkIn ?? a.check_in ?? undefined,
            checkOut: a.checkOut ?? a.check_out ?? undefined,
          };
        });
        setAttendance(mapped);
        const totalCount = Array.isArray(res) ? apiRows.length : (res as any).total ?? apiRows.length;
        setAttendanceTotal(totalCount);
      } catch (_) {
        present({ message: 'Failed to load attendance.', color: 'danger', duration: 2000, position: 'top' });
        setAttendance([]);
        setAttendanceTotal(0);
      } finally {
        setAttendanceLoading(false);
      }
    })();
  }, [attSearch, attStatus, attProject, attEmployeeId, attStart, attEnd, attPage]);

  // Load full attendance logs for read-only grouped-by-date view
  React.useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('token') || undefined;
    (async () => {
      try {
        setLogsLoading(true);

        // Determine date range based on month and optional overrides for this section only
        let rangeStart: string | undefined;
        let rangeEnd: string | undefined;
        if (logsStartDate || logsEndDate || logsMonth) {
          if (logsStartDate) rangeStart = logsStartDate;
          if (logsEndDate) rangeEnd = logsEndDate;
          if (logsMonth) {
            const [yStr, mStr] = logsMonth.split('-');
            const y = Number(yStr);
            const m = Number(mStr || '1') - 1;
            if (!rangeStart) rangeStart = new Date(y, m, 1).toISOString().slice(0, 10);
            if (!rangeEnd) rangeEnd = new Date(y, m + 1, 0).toISOString().slice(0, 10);
          }
        }

        // Fetch a larger page of records for the grouped view within selected range.
        const res = await fetchAttendance({
          page: 1,
          pageSize: 2000,
          start: rangeStart,
          end: rangeEnd,
          token,
        } as any);
        if (cancelled) return;

        const raw = (Array.isArray(res) ? res : (((res as any).data ?? (res as any).rows) || [])) as (AttendanceDto & any)[];

        // Step 1: normalize records into a structure we can deduplicate by (date + Emirates ID)
        type Normalized = AttendanceLogRow & {
          _rawStatus: string;
          _dateKey: string; // YYYY-MM-DD
          _eidKey: string;  // Emirates ID as key
          _createdAt?: number; // best-effort timestamp for tie-breaking
        };

        const normalized: Normalized[] = raw.map((a) => {
          const rawDate = a.date ?? a.check_in ?? a.checkIn;
          const dStr = rawDate
            ? (typeof rawDate === 'string' ? rawDate.slice(0, 10) : new Date(rawDate).toISOString().slice(0, 10))
            : new Date().toISOString().slice(0, 10);

          // Employee name and Emirates ID from joined employee data when available
          const employeeName =
            (a as any).employeeName ??
            (a as any).employee_name ??
            (a as any).employee?.employeeName ??
            (a as any).employee?.name ??
            '';

          const emiratesId =
            (a as any).employee?.emiratesId ??
            (a as any).emiratesId ??
            '';

          const statusRaw = String((a as any).status ?? '');
          const statusNorm = statusRaw.toUpperCase() || 'SELECT';

          const checkIn =
            (a as any).checkIn ??
            (a as any).check_in ??
            '';

          const checkOut =
            (a as any).checkOut ??
            (a as any).check_out ??
            '';

          const otHoursRaw = (a as any).otHours;
          const otHours =
            typeof otHoursRaw === 'number'
              ? otHoursRaw.toFixed(1)
              : otHoursRaw != null && otHoursRaw !== ''
              ? String(otHoursRaw)
              : '';

          const site = (a as any).location ?? '';
          const projectName =
            (a as any).project ??
            (a as any).projectName ??
            (a as any).project_name ??
            '';
          const siteProject = [site, projectName].filter(Boolean).join(' / ');

          // ApprovedBy and signature are not exposed on AttendanceDto explicitly, so read them if present
          const approvedBy = String((a as any).approvedBy || '').trim();
          const signature = String((a as any).signature || '').trim();

          // Best-effort timestamp for tie-breaking: checkIn/check_in/date
          let createdAtMs: number | undefined;
          const tsSource = (a as any).checkOut ?? (a as any).check_out ?? (a as any).checkIn ?? (a as any).check_in ?? a.date;
          if (tsSource) {
            const d = new Date(tsSource as any);
            if (!Number.isNaN(d.getTime())) createdAtMs = d.getTime();
          }

          const eidKey = String(emiratesId || '').trim();

          return {
            id: a.id,
            date: dStr,
            employeeName: String(employeeName || ''),
            emiratesId: String(emiratesId || ''),
            status: statusNorm,
            checkIn,
            checkOut,
            otHours,
            siteProject,
            approvedBy,
            signature,
            _rawStatus: statusRaw,
            _dateKey: dStr,
            _eidKey: eidKey,
            _createdAt: createdAtMs,
          };
        });

        // Step 2: de-duplicate per (date, Emirates ID)
        const byDate: Record<string, AttendanceLogRow[]> = {};
        const mapPerDateEmp = new Map<string, Normalized>(); // key: `${date}|${EID}`

        for (const r of normalized) {
          if (!r._eidKey) continue; // cannot validate without Emirates ID
          const key = `${r._dateKey}|${r._eidKey}`;
          const existing = mapPerDateEmp.get(key);

          if (!existing) {
            mapPerDateEmp.set(key, r);
            continue;
          }

          // Prefer records with a non-SELECT status over SELECT
          const existingIsSelect = !existing.status || existing.status === 'SELECT';
          const currentIsSelect = !r.status || r.status === 'SELECT';

          if (existingIsSelect && !currentIsSelect) {
            mapPerDateEmp.set(key, r);
            continue;
          }
          if (!existingIsSelect && currentIsSelect) {
            continue;
          }

          // If both have meaningful statuses or both SELECT, pick the one with the latest timestamp
          const existingTs = existing._createdAt ?? 0;
          const currentTs = r._createdAt ?? 0;
          if (currentTs > existingTs) {
            mapPerDateEmp.set(key, r);
          }
        }

        // Step 3: group chosen records by date
        for (const r of mapPerDateEmp.values()) {
          const dKey = r.date;
          if (!byDate[dKey]) byDate[dKey] = [];
          byDate[dKey]!.push({
            id: r.id,
            date: r.date,
            employeeName: r.employeeName,
            emiratesId: r.emiratesId,
            status: r.status,
            checkIn: r.checkIn,
            checkOut: r.checkOut,
            otHours: r.otHours,
            siteProject: r.siteProject,
            approvedBy: r.approvedBy,
            signature: r.signature,
          });
        }

        // Sort rows within each date by employee name for consistent display
        Object.keys(byDate).forEach((d) => {
          const rows = byDate[d] ?? [];
          byDate[d] = rows.slice().sort((a, b) => a.employeeName.localeCompare(b.employeeName));
        });

        setLogsByDate(byDate);
      } catch {
        if (!cancelled) {
          setLogsByDate({});
        }
      } finally {
        if (!cancelled) {
          setLogsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logsMonth, logsStartDate, logsEndDate]);

  function resetAttendanceFilters() {
    setAttSearch('');
    setAttStatus('All');
    setAttProject('All');
    setAttPage(1);
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="px-4 py-6 sm:px-6 lg:px-8 bg-[color:var(--bg)] space-y-6">
        <div className="text-lg font-semibold hidden lg:block">HR</div>
        <div className="zynq-muted text-sm hidden lg:block">Home &gt; HR</div>
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
          <IonButton size="small" color="medium" routerLink="/hr/attendance">Attendance</IonButton>
          <IonButton size="small" color="medium" routerLink="/hr/employees">Employees</IonButton>
          <IonButton size="small" color="medium" routerLink="/hr/payroll">Payroll</IonButton>
          <IonButton size="small" color="medium" routerLink="/hr/project-wise-report">Project-Wise Report</IonButton>
        </div>
        {/* Read-only attendance records by date */}
        <Card className="mt-6">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Attendance Records by Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <Input
                label="Month"
                type="date"
                value={logsMonth ? `${logsMonth}-01` : ''}
                onChange={(e) => {
                  const raw = (e.target as HTMLInputElement).value; // YYYY-MM-DD
                  if (!raw) {
                    setLogsMonth('');
                    return;
                  }
                  const [y, m] = raw.split('-');
                  if (!y || !m) return;
                  setLogsMonth(`${y}-${m}`);
                }}
              />
              <Input
                label="From"
                type="date"
                value={logsStartDate}
                onChange={(e) => setLogsStartDate((e.target as HTMLInputElement).value)}
              />
              <Input
                label="To"
                type="date"
                value={logsEndDate}
                onChange={(e) => setLogsEndDate((e.target as HTMLInputElement).value)}
              />
              <Select
                label="Site / Project"
                value={logsProjectFilter}
                onChange={(e) => setLogsProjectFilter((e.target as HTMLSelectElement).value)}
              >
                <option value="">All Sites / Projects</option>
                {logsProjectOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
              <div className="flex items-end justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    const y = now.getFullYear();
                    const m = String(now.getMonth() + 1).padStart(2, '0');
                    setLogsMonth(`${y}-${m}`);
                    setLogsStartDate('');
                    setLogsEndDate('');
                    setLogsProjectFilter('');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
            {/* Totals for selected project (or all) */}
            {!logsLoading && (
              <div className="text-xs sm:text-sm zynq-muted flex flex-wrap gap-4">
                <span>
                  Records: <b>{logsTotals.totalRecords}</b>
                </span>
                <span>
                  Total OT (hrs): <b>{logsTotals.totalOt.toFixed(1)}</b>
                </span>
              </div>
            )}
            {logsLoading && (
              <div className="flex items-center justify-center py-8">
                <IonSpinner name="dots" />
              </div>
            )}
            {!logsLoading && Object.keys(logsByDate).length === 0 && (
              <div className="text-sm zynq-muted">No attendance records available.</div>
            )}
            {!logsLoading && Object.keys(logsByDate).length > 0 && (
              <div className="space-y-4">
                {Object.keys(logsByDate)
                  .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
                  .map((date) => (
                    <Card key={date} className="border zynq-border bg-[color:var(--surface)]">
                      <CardHeader>
                        <CardTitle>{new Date(date).toLocaleDateString()}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-auto rounded-xl border zynq-border text-xs sm:text-sm">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b zynq-border bg-[color:var(--muted)]/10">
                                <th className="px-3 py-2 text-left">EMPLOYEE NAME</th>
                                <th className="px-3 py-2 text-left">EMIRATES ID</th>
                                <th className="px-3 py-2 text-left">STATUS</th>
                                <th className="px-3 py-2 text-left">CHECK-IN</th>
                                <th className="px-3 py-2 text-left">CHECK-OUT</th>
                                <th className="px-3 py-2 text-left">OT (HRS)</th>
                                <th className="px-3 py-2 text-left">SITE / PROJECT</th>
                                <th className="px-3 py-2 text-left">APPROVED BY</th>
                                <th className="px-3 py-2 text-left">SIGNATURE</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(logsByDate[date] || [])
                                .filter((row) => !logsProjectFilter || row.siteProject === logsProjectFilter)
                                .map((row) => (
                                <tr key={row.id} className="border-b zynq-border last:border-0">
                                  <td className="px-3 py-2 align-top">{row.employeeName || '—'}</td>
                                  <td className="px-3 py-2 align-top">{row.emiratesId || '—'}</td>
                                  <td className="px-3 py-2 align-top">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs ${
                                        row.status === 'P' || row.status === 'PRESENT'
                                          ? 'bg-emerald-500/10 text-emerald-500'
                                          : row.status === 'A' || row.status === 'ABSENT'
                                          ? 'bg-rose-500/10 text-rose-500'
                                          : row.status === 'HOLIDAY'
                                          ? 'bg-slate-500/10 text-slate-400'
                                          : 'bg-amber-500/10 text-amber-500'
                                      }`}
                                    >
                                      {row.status || 'SELECT'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 align-top">
                                    {row.checkIn
                                      ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : '—'}
                                  </td>
                                  <td className="px-3 py-2 align-top">
                                    {row.checkOut
                                      ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : '—'}
                                  </td>
                                  <td className="px-3 py-2 align-top">{row.otHours || '—'}</td>
                                  <td className="px-3 py-2 align-top">{row.siteProject || '—'}</td>
                                  <td className="px-3 py-2 align-top">{row.approvedBy || '—'}</td>
                                  <td className="px-3 py-2 align-top">{row.signature || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </IonContent>
    </IonPage>
  );
}

// Modals
function AttendanceViewModal({ row, onClose }: { row: Attendance | null, onClose: () => void }) {
  return (
    <Modal open={!!row} onClose={onClose} title="Attendance — View">
      {row && (
        <div className="space-y-2 text-sm">
          <div><b>Date:</b> {new Date(row.date).toLocaleDateString()}</div>
          <div><b>Employee:</b> {row.employee}</div>
          <div><b>Project:</b> {row.project}</div>
          <div><b>Status:</b> {row.status}</div>
          <div><b>In:</b> {row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : '—'}</div>
          <div><b>Out:</b> {row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : '—'}</div>
          <div><b>Hours:</b> {row.checkIn && row.checkOut ? (Math.max(0,(new Date(row.checkOut).getTime() - new Date(row.checkIn).getTime())/36e5)).toFixed(1) : '—'}</div>
          <div><b>Overtime:</b> {row.checkIn && row.checkOut ? (Math.max(0,((new Date(row.checkOut).getTime() - new Date(row.checkIn).getTime())/36e5 - 8))).toFixed(1) : '—'}</div>
        </div>
      )}
    </Modal>
  );
}

function AttendanceEditModal({ row, onClose }: { row: Attendance | null, onClose: () => void }) {
  const [status, setStatus] = useState<Attendance['status']>(row?.status || 'Present');
  return (
    <Modal open={!!row} onClose={onClose} title="Attendance — Edit">
      {row && (
        <div className="space-y-3">
          <div className="text-sm">Update status for <b>{row.employee}</b> ({new Date(row.date).toLocaleDateString()})</div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as Attendance['status'])}>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={onClose}>Save</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}


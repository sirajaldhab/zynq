import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Select from '../../ui/Select';
import { useAuth } from '../../auth/AuthContext';
import { fetchEmployees, fetchAttendance, EmployeeDto, createAttendance } from '../../api/hrService';
import { fetchProjects, ProjectDto } from '../../api/projectsService';
import { chevronBackOutline } from 'ionicons/icons';

type EntryRow = {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  emiratesId: string;
  checkIn: string;
  checkOut: string;
  status: '' | 'A' | 'P' | 'HALF DAY' | 'HOLIDAY';
  otHours: string;
  mainContractor: string;
  projectId: string;
  site: string;
  approvedBy: string;
  signature: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dateOnlyLocal(raw: any): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const STORAGE_KEY_ROWS = 'hr_attendance_entry_rows_v1';
const STORAGE_KEY_SUBMITTED = 'hr_attendance_entry_submitted_dates_v1';

export default function HRAttendanceEntry() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [employees, setEmployees] = React.useState<EmployeeDto[]>([]);
  const [projects, setProjects] = React.useState<ProjectDto[]>([]);
  const [rows, setRows] = React.useState<EntryRow[]>([]);
  const [selectedDate, setSelectedDate] = React.useState(todayIso);
  const [bulkCheckIn, setBulkCheckIn] = React.useState('');
  const [bulkCheckOut, setBulkCheckOut] = React.useState('');
  const [editingSiteRowId, setEditingSiteRowId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [infoMessage, setInfoMessage] = React.useState('');
  const [hideTable, setHideTable] = React.useState(false);
  const [showValidationErrors, setShowValidationErrors] = React.useState(false);
  const [pendingDates, setPendingDates] = React.useState<string[]>([]);
  const [submittedDates, setSubmittedDates] = React.useState<string[]>([]);

  const otOptions = React.useMemo(
    () => ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8'],
    [],
  );

  const mainContractorOptions = React.useMemo(
    () => Array.from(new Set(projects.map((p) => p.main_contractor || '').filter(Boolean))),
    [projects],
  );

  function projectOptionsFor(mainContractor: string) {
    if (!mainContractor) return [];
    return projects.filter((p) => p.main_contractor === mainContractor);
  }

  function siteOptionsFor(mainContractor: string, projectId: string) {
    if (!mainContractor || !projectId) return [];
    const p = projects.find((x) => x.id === projectId && x.main_contractor === mainContractor);
    const site = p?.site || '';
    return site ? [site] : [];
  }

  function projectNameById(id: string) {
    if (!id) return '';
    const p = projects.find((x) => x.id === id);
    return p?.name || '';
  }

  const approvedBy = React.useMemo(() => {
    let name = 'User';
    try {
      const payload = accessToken ? JSON.parse(atob(accessToken.split('.')[1] || '')) : {};
      name = payload.name || payload.username || payload.email || name;
    } catch {}
    return name;
  }, [accessToken]);

  function buildRowsForDate(date: string): EntryRow[] {
    return employees
      .filter((e) => String(e.status || '').toUpperCase() === 'ACTIVE')
      .map((e, idx) => ({
        id: e.id || `row-${idx + 1}`,
        date,
        employeeId: e.id,
        employeeName: e.employeeName || '',
        emiratesId: e.emiratesId || '',
        checkIn: '',
        checkOut: '',
        status: '',
        otHours: '0',
        mainContractor: '',
        projectId: '',
        site: '',
        approvedBy,
        signature: '',
      }));
  }

  React.useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    (async () => {
      try {
        const [empRes, projRes] = await Promise.all([
          fetchEmployees({ page: 1, pageSize: 200, token }),
          fetchProjects({ page: 1, pageSize: 200, token }),
        ]);
        setEmployees(empRes.data || []);
        setProjects(projRes.data || []);
      } catch {
        setEmployees([]);
        setProjects([]);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!employees.length) return;
    const today = todayIso();
    const activeDate = selectedDate || today;
    setRows((prev) => {
      // If we already have rows for the currently selected date, keep them
      if (prev.length > 0 && prev[0]?.date === activeDate) return prev;

      // Try to restore from localStorage, but ONLY if the stored rows belong to
      // this same activeDate. This avoids the bug where rows from a different
      // date (e.g. 22/11) are reused when the user navigates to 10/10, causing
      // submissions to be saved under the wrong day.
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ROWS);
        if (raw) {
          const parsed: EntryRow[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.date === activeDate) {
            return parsed;
          }
        }
      } catch {}

      // Default: build rows for selected date (or today) for all active employees
      return buildRowsForDate(activeDate);
    });
    // Load submitted dates for the current month from backend attendance records
    (async () => {
      try {
        const token = localStorage.getItem('token') || undefined;

        // Compute month start / end for the month of "today"
        const [yStr, mStr, dStr] = today.split('-');
        const y = Number(yStr);
        const mIndex = Number(mStr || '1') - 1;
        const endDate = new Date(y, mIndex + 1, 0);
        const startStr = `${yStr}-${mStr}-01`;
        const endStr = `${yStr}-${mStr}-${String(endDate.getDate()).padStart(2, '0')}`;

        const attRes = await fetchAttendance({
          page: 1,
          pageSize: 2000,
          start: startStr,
          end: endStr,
          token,
        } as any);

        const att = attRes.data || [];

        // Build a set of ACTIVE employee IDs for completeness checks
        const activeEmployeeIds = new Set(
          employees
            .filter((e) => String(e.status || '').toUpperCase() === 'ACTIVE')
            .map((e) => e.id)
            .filter(Boolean),
        );

        // Group attendance records by date -> set of employeeIds that have any record
        const dateToEmployeeIds = new Map<string, Set<string>>();
        for (const a of att as any[]) {
          const rawDate = a.date ?? a.check_in ?? a.checkIn;
          if (!rawDate) continue;
          const dStr2 =
            typeof rawDate === 'string'
              ? rawDate.slice(0, 10)
              : dateOnlyLocal(rawDate);
          // Only consider records belonging to the same year-month as today
          if (dStr2.slice(0, 7) !== `${yStr}-${mStr}`) continue;

          const empId = String(a.employeeId || a.employee_id || '').trim();
          if (!empId) continue;

          if (!dateToEmployeeIds.has(dStr2)) {
            dateToEmployeeIds.set(dStr2, new Set<string>());
          }
          dateToEmployeeIds.get(dStr2)!.add(empId);
        }

        // A date is considered submitted only if ALL active employees
        // have at least one attendance record on that date.
        const submittedSet = new Set<string>();
        dateToEmployeeIds.forEach((empSet, dateStr) => {
          // If there are no active employees, treat nothing as submitted
          if (!activeEmployeeIds.size) return;
          let allHaveRecords = true;
          for (const id of activeEmployeeIds) {
            if (!empSet.has(id)) {
              allHaveRecords = false;
              break;
            }
          }
          if (allHaveRecords) submittedSet.add(dateStr);
        });

        // Merge with locally remembered submitted dates so that any date the
        // user has successfully submitted in this browser session remains
        // marked as submitted, even if the server listing misses it.
        try {
          const stored = localStorage.getItem(STORAGE_KEY_SUBMITTED);
          if (stored) {
            const parsed: string[] = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              for (const d of parsed) submittedSet.add(d);
            }
          }
        } catch {}

        const submitted = Array.from(submittedSet);
        setSubmittedDates(submitted);

        // Selected date status message
        if (submittedSet.has(activeDate)) {
          setHideTable(true);
          setInfoMessage(`Attendance submitted for ${activeDate}`);
        } else {
          setHideTable(false);
          setInfoMessage(`Pending attendance entry for ${activeDate}`);
        }

        // Compute pending (missing) dates for current month up to and including today
        try {
          const currentDay = Number(dStr || '1');
          const pending: string[] = [];
          for (let d = 1; d <= currentDay; d++) {
            const dateStr = `${yStr}-${mStr}-${String(d).padStart(2, '0')}`;
            if (!submittedSet.has(dateStr)) {
              pending.push(dateStr);
            }
          }
          setPendingDates(pending);
        } catch {
          setPendingDates([]);
        }
      } catch {
        setHideTable(false);
        setInfoMessage('Pending Attendance Entry');
        setPendingDates([]);
        setSubmittedDates([]);
      }
    })();
  }, [employees, approvedBy, selectedDate]);

  // Persist rows locally until Clear or Submit
  React.useEffect(() => {
    try {
      if (rows.length > 0) {
        localStorage.setItem(STORAGE_KEY_ROWS, JSON.stringify(rows));
      }
    } catch {}
  }, [rows]);

  function updateRow(id: string, patch: Partial<EntryRow>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  function applyCheckInAll() {
    if (!bulkCheckIn) return;
    setRows((prev) => prev.map((r) => ({ ...r, checkIn: bulkCheckIn })));
  }

  function applyCheckOutAll() {
    if (!bulkCheckOut) return;
    setRows((prev) => prev.map((r) => ({ ...r, checkOut: bulkCheckOut })));
  }

  function addRow() {
    const idx = rows.length + 1;
    setRows((prev) => [
      ...prev,
      {
        id: `row-${idx}`,
        date: todayIso(),
        employeeId: '',
        employeeName: '',
        emiratesId: '',
        checkIn: '',
        checkOut: '',
        status: '',
        otHours: '',
        mainContractor: '',
        projectId: '',
        site: '',
        approvedBy,
        signature: '',
      },
    ]);
  }

  function clearAll() {
    setErrorMessage('');
    setInfoMessage('Pending Attendance Entry');
    setShowValidationErrors(false);
    try {
      localStorage.removeItem(STORAGE_KEY_ROWS);
    } catch {}
    const today = todayIso();
    const activeDate = selectedDate || today;
    setRows(buildRowsForDate(activeDate));
    setHideTable(false);
  }

  function openPendingDate(date: string) {
    setErrorMessage('');
    setInfoMessage('Pending Attendance Entry');
    setShowValidationErrors(false);
    try {
      localStorage.removeItem(STORAGE_KEY_ROWS);
    } catch {}
    setSelectedDate(() => date);
    setRows(buildRowsForDate(date));
    setHideTable(false);
  }

  function isRowComplete(row: EntryRow) {
    const s = String(row.status || '').toUpperCase();
    // For Absent or Holiday, only basic identity + status are required
    if (s === 'A' || s === 'HOLIDAY') {
      return !!row.employeeId && !!row.status;
    }
    // For Present / Half Day, all mandatory fields must be filled
    return (
      !!row.date &&
      !!row.employeeId &&
      !!row.employeeName &&
      !!row.emiratesId &&
      !!row.checkIn &&
      !!row.checkOut &&
      !!row.status &&
      !!row.mainContractor &&
      !!row.projectId &&
      !!row.site &&
      !!row.approvedBy
    );
  }

  async function submitAll() {
    setErrorMessage('');
    setInfoMessage('');
    setShowValidationErrors(true);
    if (!rows.length) return;

    // Validate mandatory fields (all except OT and Signature)
    const hasMissing = rows.some((r) => !isRowComplete(r));
    if (hasMissing) {
      setErrorMessage('Complete Attendance Entry');
      return;
    }

    const token = localStorage.getItem('token') || undefined;
    setSubmitting(true);
    try {
      for (const r of rows) {
        const date = r.date || todayIso();
        const s = String(r.status || '').toUpperCase();

        // Always send a valid check_in so backend can create/update the record.
        // For Absent/Holiday, use the day at 00:00; for others, use the entered check-in time.
        const checkInIso =
          s === 'A' || s === 'HOLIDAY'
            ? `${date}T00:00:00`
            : `${date}T${r.checkIn}:00`;

        const base: any = {
          employeeId: r.employeeId,
          emiratesId: r.emiratesId,
          status: r.status,
          check_in: checkInIso,
        };

        if (!(s === 'A' || s === 'HOLIDAY')) {
          const checkOutIso = r.checkOut ? `${date}T${r.checkOut}:00` : undefined;
          if (checkOutIso) base.check_out = checkOutIso;
          if (r.site) base.location = r.site;
        }

        // Optional field: OT (always parsed, including 0)
        if (r.otHours !== undefined) {
          const parsed = Number(r.otHours || '0');
          if (!Number.isNaN(parsed)) base.otHours = parsed;
        }
        if (r.signature) {
          base.signature = r.signature;
        }

        await createAttendance({
          ...base,
          token,
        });
      }

      // Mark selected date as submitted in-memory and recompute pending dates
      const today = todayIso();
      const date = rows[0]?.date || selectedDate || today;
      const todayParts = today.split('-');
      const [yStr, mStr, dStr] = todayParts;
      const currentDay = Number(dStr || '1');

      setSubmittedDates((prev) => {
        const set = new Set(prev);
        set.add(date);
        const nextSubmitted = Array.from(set);

        // Persist submitted dates locally so future refreshes remember them
        try {
          localStorage.setItem(STORAGE_KEY_SUBMITTED, JSON.stringify(nextSubmitted));
        } catch {}

        const pending: string[] = [];
        for (let d = 1; d < currentDay; d++) {
          const dateStr = `${yStr}-${mStr}-${String(d).padStart(2, '0')}`;
          if (!set.has(dateStr)) {
            pending.push(dateStr);
          }
        }
        setPendingDates(pending);

        return nextSubmitted;
      });

      // Clear local rows and show success message for this date
      try {
        localStorage.removeItem(STORAGE_KEY_ROWS);
      } catch {}
      setHideTable(true);
      setInfoMessage('Selected date attendance submitted');
      setShowValidationErrors(false);
    } catch (err) {
      setErrorMessage('Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)] py-8">
        <div className="space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden space-y-1">
            <div className="text-base font-semibold">Attendance Entry</div>
            <div className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">HR / Attendance</div>
          </div>
          <div className="hidden lg:block">
            <div className="text-lg font-semibold">HR / Attendance Entry</div>
            <div className="zynq-muted text-sm">Home &gt; HR &gt; Attendance &gt; Entry</div>
          </div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 flex items-center gap-2 w-full sm:w-auto justify-center"
              onClick={() => navigate('/hr/attendance')}
            >
              <IonIcon icon={chevronBackOutline} />
              <span>Back</span>
            </Button>
          </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Attendance Entry</CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="zynq-muted">Select Date</span>
                <input
                  type="date"
                  className={`zynq-input text-xs sm:text-sm w-40$${''}`.replace('$$', '')}
                  max={todayIso()}
                  value={selectedDate}
                  onChange={(e) => {
                    const value = (e.target as HTMLInputElement).value;
                    if (!value) return;
                    // Prevent selecting future dates
                    if (value > todayIso()) return;
                    setSelectedDate(value);
                    setRows([]);
                  }}
                />
                {pendingDates.includes(selectedDate) && (
                  <span className="text-rose-500 text-xs font-medium">Pending</span>
                )}
                {!pendingDates.includes(selectedDate) && submittedDates.includes(selectedDate) && (
                  <span className="text-emerald-500 text-xs font-medium">Submitted</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={clearAll}
                className="w-full sm:w-auto"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={submitAll}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingDates.length > 0 && (
              <div className="mb-3 text-xs sm:text-sm">
                <div className="mb-1 zynq-muted">Pending days (not submitted):</div>
                <div className="flex flex-wrap gap-2">
                  {pendingDates.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => openPendingDate(d)}
                      className="px-2 py-1 rounded border border-rose-400/60 text-rose-500 text-xs bg-rose-500/5 hover:bg-rose-500/10"
                    >
                      {new Date(d).toLocaleDateString()}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {infoMessage && (
              <div className="mb-2 text-xs sm:text-sm text-emerald-500 font-medium">
                {infoMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-2 text-xs sm:text-sm text-rose-500 font-medium">
                {errorMessage}
              </div>
            )}
            {!hideTable && (
              <>
                <div className="mb-3 flex flex-col gap-3 text-xs sm:text-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <span className="zynq-muted text-xs sm:text-sm">Set Check-In for all</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        className="zynq-input"
                        value={bulkCheckIn}
                        onChange={(e) => setBulkCheckIn((e.target as HTMLInputElement).value)}
                      />
                      <Button size="sm" variant="secondary" onClick={applyCheckInAll}>Apply</Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <span className="zynq-muted text-xs sm:text-sm">Set Check-Out for all</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        className="zynq-input"
                        value={bulkCheckOut}
                        onChange={(e) => setBulkCheckOut((e.target as HTMLInputElement).value)}
                      />
                      <Button size="sm" variant="secondary" onClick={applyCheckOutAll}>Apply</Button>
                    </div>
                  </div>
                </div>
                <div className="overflow-auto rounded-xl border zynq-border bg-[color:var(--surface)] text-xs sm:text-sm shadow-[var(--shadow)]">
                  <table className="min-w-[960px]">
                <thead>
                  <tr className="border-b zynq-border bg-[color:var(--muted)]/10">
                    <th className="px-3 py-2 text-left">DATE</th>
                    <th className="px-3 py-2 text-left">EMPLOYEE NAME</th>
                    <th className="px-3 py-2 text-left">EMIRATES ID</th>
                    <th className="px-3 py-2 text-left">CHECK-IN</th>
                    <th className="px-3 py-2 text-left">CHECK-OUT</th>
                    <th className="px-3 py-2 text-left">STATUS</th>
                    <th className="px-3 py-2 text-left">
                      <div className="font-semibold">OT (HRS)</div>
                      <div className="zynq-muted text-[10px] leading-tight">Overtime</div>
                    </th>
                    <th className="px-3 py-2 text-left">SITE / PROJECT</th>
                    <th className="px-3 py-2 text-left">APPROVED BY</th>
                    <th className="px-3 py-2 text-left">SIGNATURE</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const statusUpper = String(row.status || '').toUpperCase();
                    const isAbsentLike = statusUpper === 'A' || statusUpper === 'HOLIDAY';
                    const showTimeInputs = statusUpper === 'P' || statusUpper === 'HALF DAY';
                    const statusCls =
                      row.status === 'P'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : row.status === 'A'
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-slate-500/10 text-slate-400';
                    return (
                      <tr key={row.id} className="border-b zynq-border last:border-0">
                        <td className="px-3 py-2 align-top">
                          <input
                            type="date"
                            className="zynq-input w-full"
                            value={row.date}
                            readOnly
                            disabled
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="text-sm">
                            {row.employeeName}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <input
                            className="zynq-input w-full"
                            value={row.emiratesId}
                            readOnly
                            disabled
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          {showTimeInputs ? (
                            <input
                              type="time"
                              className={`zynq-input w-full${
                                showValidationErrors && !row.checkIn && !isAbsentLike
                                  ? ' border-rose-500 focus:ring-rose-500'
                                  : ''
                              }`}
                              value={row.checkIn}
                              onChange={(e) => updateRow(row.id, { checkIn: (e.target as HTMLInputElement).value })}
                            />
                          ) : null}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {showTimeInputs ? (
                            <input
                              type="time"
                              className={`zynq-input w-full${
                                showValidationErrors && !row.checkOut && !isAbsentLike
                                  ? ' border-rose-500 focus:ring-rose-500'
                                  : ''
                              }`}
                              value={row.checkOut}
                              onChange={(e) => updateRow(row.id, { checkOut: (e.target as HTMLInputElement).value })}
                            />
                          ) : null}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex items-center gap-2">
                            <Select
                              value={row.status}
                              className={
                                showValidationErrors && !row.status
                                  ? 'border-rose-500 focus:ring-rose-500'
                                  : undefined
                              }
                              onChange={(e) => {
                                const value = (e.target as HTMLSelectElement).value as EntryRow['status'];
                                if (value === 'P') {
                                  // Auto-fill default times for Present, keeping them editable
                                  const nextCheckIn = row.checkIn || '06:00';
                                  const nextCheckOut = row.checkOut || '16:00';
                                  updateRow(row.id, {
                                    status: value,
                                    checkIn: nextCheckIn,
                                    checkOut: nextCheckOut,
                                  });
                                } else if (value === 'HALF DAY') {
                                  // Half Day: keep time fields blank, user must enter manually
                                  updateRow(row.id, {
                                    status: value,
                                    checkIn: '',
                                    checkOut: '',
                                  });
                                } else if (value === 'A' || value === 'HOLIDAY') {
                                  // Non-working statuses: clear and hide time fields
                                  updateRow(row.id, {
                                    status: value,
                                    checkIn: '',
                                    checkOut: '',
                                  });
                                } else {
                                  // Empty/Select state: clear status and times
                                  updateRow(row.id, {
                                    status: '',
                                    checkIn: '',
                                    checkOut: '',
                                  });
                                }
                              }}
                            >
                              <option value="">Select</option>
                              <option value="P">P</option>
                              <option value="A">A</option>
                              <option value="HALF DAY">HALF DAY</option>
                              <option value="HOLIDAY">HOLIDAY</option>
                            </Select>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${statusCls}`}>
                              {row.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Select
                            value={row.otHours}
                            onChange={(e) => updateRow(row.id, { otHours: (e.target as HTMLSelectElement).value })}
                            disabled={isAbsentLike}
                          >
                            {otOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-3 py-2 align-top">
                          {editingSiteRowId === row.id ? (
                            <div className="flex flex-col gap-1">
                              <Select
                                value={row.mainContractor}
                                className={
                                  showValidationErrors && !row.mainContractor && !isAbsentLike
                                    ? 'border-rose-500 focus:ring-rose-500'
                                    : undefined
                                }
                                onChange={(e) => {
                                  const value = (e.target as HTMLSelectElement).value;
                                  updateRow(row.id, {
                                    mainContractor: value,
                                    projectId: '',
                                    site: '',
                                  });
                                }}
                              >
                                <option value="">Main-Contractor</option>
                                {mainContractorOptions.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </Select>
                              <Select
                                value={row.projectId}
                                className={
                                  showValidationErrors && !row.projectId && !isAbsentLike
                                    ? 'border-rose-500 focus:ring-rose-500'
                                    : undefined
                                }
                                onChange={(e) => {
                                  const value = (e.target as HTMLSelectElement).value;
                                  const sites = siteOptionsFor(row.mainContractor, value);
                                  updateRow(row.id, {
                                    projectId: value,
                                    site: sites[0] || '',
                                  });
                                }}
                                disabled={!row.mainContractor}
                              >
                                <option value="">Project</option>
                                {projectOptionsFor(row.mainContractor).map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </Select>
                              <Select
                                value={row.site}
                                className={
                                  showValidationErrors && !row.site && !isAbsentLike
                                    ? 'border-rose-500 focus:ring-rose-500'
                                    : undefined
                                }
                                onChange={(e) => {
                                  const value = (e.target as HTMLSelectElement).value;
                                  updateRow(row.id, { site: value });
                                }}
                                disabled={!row.projectId}
                              >
                                <option value="">Site</option>
                                {siteOptionsFor(row.mainContractor, row.projectId).map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </Select>
                              <div className="flex justify-end pt-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setEditingSiteRowId(null)}
                                >
                                  Done
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className={`w-full text-left text-xs sm:text-sm${
                                showValidationErrors && !row.site && !isAbsentLike
                                  ? ' border border-rose-500 rounded-md'
                                  : ''
                              }`}
                              onClick={() => {
                                if (isAbsentLike) return;
                                setEditingSiteRowId(row.id);
                              }}
                            >
                              <div className="font-medium">
                                {row.site || 'Select site'}
                              </div>
                              {(row.mainContractor || row.projectId) && (
                                <div className="zynq-muted text-[11px] leading-tight">
                                  {row.mainContractor || '—'}
                                  {row.mainContractor && row.projectId ? '  b7 ' : ''}
                                  {row.projectId ? projectNameById(row.projectId) || row.projectId : ''}
                                </div>
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <input
                            className="zynq-input w-full"
                            value={row.approvedBy}
                            readOnly
                            disabled
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <input
                            className="zynq-input w-full"
                            value={row.signature}
                            onChange={(e) => updateRow(row.id, { signature: (e.target as HTMLInputElement).value })}
                            placeholder="Signature (optional)"
                            disabled={isAbsentLike}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </IonContent>
    </IonPage>
  );
}

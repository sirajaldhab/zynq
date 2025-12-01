import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonIcon, useIonToast } from '@ionic/react';
import { useParams, useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { chevronBackOutline } from 'ionicons/icons';
import { fetchProjects, ProjectDto } from '../../api/projectsService';
import { fetchMaterials, MaterialDto } from '../../api/materialsService';
import { fetchInvoices } from '../../api/financeService';
import { fetchAttendance } from '../../api/hrService';
import { fetchSiteDaySalaries, SiteDaySalaryDto } from '../../api/hrProjectSalaryService';
import { fetchManpowerRecords, ManpowerRecordDto } from '../../api/manpowerRecordsService';
import { fetchProjectExtra, saveProjectExtra } from '../../api/projectExtrasService';

export default function ProjectView() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [present] = useIonToast();
  const [project, setProject] = useState<ProjectDto | null | undefined>(undefined);
  const [materialTotal, setMaterialTotal] = useState<number | null>(null);
  const [receivedTotal, setReceivedTotal] = useState<number | null>(null);
  const [manpowerGrandTotal, setManpowerGrandTotal] = useState<number | null>(null);
  const [otherText, setOtherText] = useState<string>('');
  const [otherInitialLoaded, setOtherInitialLoaded] = useState(false);
  const [savingOther, setSavingOther] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    (async () => {
      try {
        const res = await fetchProjects({ page: 1, pageSize: 1000, token });
        const found = (res.data || []).find((p: ProjectDto) => p.id === projectId);
        setProject(found || null);
      } catch (_) {
        present({ message: 'Failed to load project.', color: 'danger', duration: 2000, position: 'top' });
        setProject(null);
      }
    })();
  }, [projectId]);

  // Load per-project "Other" data
  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    (async () => {
      if (!projectId) {
        setOtherText('');
        setOtherInitialLoaded(false);
        return;
      }
      try {
        const res = await fetchProjectExtra({ projectId, token });
        setOtherText((res && res.otherText) || '');
        setOtherInitialLoaded(true);
      } catch (_) {
        setOtherText('');
        setOtherInitialLoaded(true);
      }
    })();
  }, [projectId]);

  // Compute Manpower grand total for the current project using the
  // same logic as HR > Project-Wise Report, matched strictly by site.
  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    (async () => {
      if (!projectId || !project || !project.site) {
        setManpowerGrandTotal(null);
        return;
      }

      const targetSite = String(project.site || '').trim();
      if (!targetSite) {
        setManpowerGrandTotal(null);
        return;
      }

      try {
        // 1) Aggregate attendance for just this site's records
        const presentCounts: Record<string, number> = {};
        const halfDayCounts: Record<string, number> = {};
        const otSums: Record<string, number> = {};
        let page = 1;
        const pageSize = 1000;
        while (true) {
          const attRes: any = await fetchAttendance({ page, pageSize, token } as any);
          const rows: any[] = (attRes?.data || attRes?.rows || []) as any[];
          if (!rows.length) break;

          for (const r of rows) {
            const status = String((r as any).status || '').toUpperCase();
            const site = String((r as any).location || '').trim();
            if (!site || site !== targetSite) continue;

            if (status === 'P' || status === 'PRESENT') {
              presentCounts[site] = (presentCounts[site] || 0) + 1;
            } else if (status === 'HALF DAY' || status === 'HALF-DAY') {
              halfDayCounts[site] = (halfDayCounts[site] || 0) + 1;
            }

            const otRaw = (r as any).otHours;
            const otVal = typeof otRaw === 'number' ? otRaw : Number(otRaw || 0);
            if (!Number.isNaN(otVal) && otVal !== 0) {
              otSums[site] = (otSums[site] || 0) + otVal;
            }
          }

          if (rows.length < pageSize) break;
          page += 1;
        }

        const presentCount = presentCounts[targetSite] || 0;
        const halfDayCount = halfDayCounts[targetSite] || 0;
        const otSum = otSums[targetSite] || 0;

        // 2) Find day salary for this site
        const salaryRes = await fetchSiteDaySalaries({ token });
        const salaryRows = salaryRes.data || [];
        let daySalaryNumber = 0;
        for (const row of salaryRows as SiteDaySalaryDto[]) {
          const siteName = String(row.site || '').trim();
          if (siteName === targetSite) {
            daySalaryNumber = Number(row.daySalary || 0);
          }
        }

        // 3) Aggregate external labour total for this site
        const manpowerRecords: ManpowerRecordDto[] = (await fetchManpowerRecords({ token })) || [];
        let externalLabours = 0;
        for (const r of manpowerRecords) {
          const siteName = String(r.site || '').trim();
          if (!siteName || siteName !== targetSite) continue;
          const totalVal = Number((r as any).total || 0);
          if (!Number.isFinite(totalVal) || totalVal === 0) continue;
          externalLabours += totalVal;
        }

        // 4) Compute Total and Grand Total using the same formula
        const totalInternal = daySalaryNumber
          ? daySalaryNumber * (presentCount + halfDayCount * 0.5 + otSum)
          : 0;
        const grandTotal = totalInternal + externalLabours;

        setManpowerGrandTotal(grandTotal === 0 ? null : grandTotal);
      } catch (_) {
        setManpowerGrandTotal(null);
      }
    })();
  }, [projectId, project]);

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    (async () => {
      if (!projectId) {
        setMaterialTotal(null);
        return;
      }
      try {
        const res: any = await fetchMaterials({ projectId, token });
        const data: MaterialDto[] = (Array.isArray(res) ? res : res.data) || [];
        const sum = data.reduce(
          (acc, r) => acc + (typeof r.total === 'number' ? r.total : Number((r as any).total || 0)),
          0,
        );
        setMaterialTotal(sum);
      } catch (_) {
        setMaterialTotal(null);
      }
    })();
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    (async () => {
      if (!projectId) {
        setReceivedTotal(null);
        return;
      }
      try {
        let page = 1;
        const pageSize = 100;
        let sum = 0;
        while (true) {
          const res: any = await fetchInvoices({ page, pageSize, token });
          const data = ((res as any).rows ?? (res as any).data ?? []) as any[];
          if (!data.length) break;
          for (const inv of data) {
            const invProjectId = (inv as any).projectId || (inv as any).project?.id;
            const status = String(inv.status || '').toLowerCase();
            const isReceived = status === 'received' || status === 'paid';
            if (isReceived && invProjectId === projectId) {
              const s = Number(inv.subtotal || 0);
              const v = Number(
                inv.vat != null
                  ? inv.vat
                  : Math.round(s * 0.05 * 100) / 100,
              );
              sum += s + v;
            }
          }
          if (data.length < pageSize) break;
          page += 1;
        }
        setReceivedTotal(sum);
      } catch (_) {
        setReceivedTotal(null);
      }
    })();
  }, [projectId]);

  async function handleSaveOther() {
    if (!projectId) return;
    const token = localStorage.getItem('token') || undefined;
    setSavingOther(true);
    try {
      await saveProjectExtra({ projectId, otherText: otherText.trim(), token });
      present({ message: 'Other details saved.', color: 'success', duration: 1500, position: 'top' });
    } catch (_) {
      present({ message: 'Failed to save Other details.', color: 'danger', duration: 2000, position: 'top' });
    } finally {
      setSavingOther(false);
    }
  }

  const numericOther = otherText === '' ? 0 : Number(otherText);
  const profitLoss =
    receivedTotal != null && materialTotal != null && manpowerGrandTotal != null && !Number.isNaN(numericOther)
      ? receivedTotal - materialTotal - manpowerGrandTotal - numericOther
      : null;

  const notFound = project === null;

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)]">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-screen-md lg:max-w-none pt-6 pb-4 space-y-4">
            <div className="lg:hidden space-y-1">
              <div className="text-base font-semibold">Project Details</div>
              <div className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Projects / View</div>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-lg font-semibold hidden lg:block">Project Details</div>
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={() => navigate('/projects')}
              >
                <IonIcon icon={chevronBackOutline} />
                <span>Back</span>
              </Button>
            </div>
            <div className="zynq-muted text-sm hidden lg:block">Home &gt; Projects &gt; View</div>
          {project === undefined ? (
            <div className="mt-4 text-sm">Loading...</div>
          ) : notFound ? (
            <div className="mt-4 text-sm font-medium">Project not found</div>
          ) : (
            <div className="mt-4 space-y-4">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="text-base font-semibold">{project.name}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Company</div>
                        <div className="zynq-muted">{(project as any).company?.name || '—'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Main Contractor</div>
                        <div className="zynq-muted">{project.main_contractor || '—'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Project Manager</div>
                        <div className="zynq-muted">{project.project_manager_id || '—'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Client</div>
                        <div className="zynq-muted">{(project as any).client?.name || project.clientId || '—'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Project Name</div>
                        <div className="zynq-muted">{project.name}</div>
                      </div>
                      <div>
                        <div className="font-medium">Site</div>
                        <div className="zynq-muted">{project.site || '—'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Type</div>
                        <div className="zynq-muted">{project.parentId ? 'Sub' : 'Main'}</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-end">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}/material-delivery`, { state: { projectName: project.name } })}
                        className="font-semibold sm:w-auto w-full"
                      >
                        Go to Material Delivery
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Received Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {receivedTotal !== null
                        ? receivedTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '—'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Material Delivery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {materialTotal !== null
                        ? materialTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '—'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Manpower</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {manpowerGrandTotal !== null
                        ? manpowerGrandTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '—'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Other</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <input
                      type="number"
                      className="w-full rounded-md border zynq-border bg-[color:var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-red-600 dark:text-red-400"
                      value={otherText}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || !Number.isNaN(Number(v))) {
                          setOtherText(v);
                        }
                      }}
                      disabled={!projectId || !otherInitialLoaded || savingOther}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleSaveOther}
                        disabled={!projectId || savingOther}
                      >
                        {savingOther ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Profit/Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={
                        'text-lg font-bold ' +
                        (profitLoss == null
                          ? ''
                          : profitLoss >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400')
                      }
                    >
                      {profitLoss !== null
                        ? profitLoss.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '—'}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Donut chart breakdown for current project */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Value Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {materialTotal == null && manpowerGrandTotal == null && otherText === '' && profitLoss == null ? (
                    <div className="text-sm zynq-muted">No data available to display chart.</div>
                  ) : (
                    <div className="flex flex-col lg:flex-row items-center gap-6">
                      {/* Donut chart */}
                      <div className="w-48 h-48 sm:w-56 sm:h-56 relative">
                        {(() => {
                          const material = materialTotal || 0;
                          const manpower = manpowerGrandTotal || 0;
                          const other = otherText === '' ? 0 : Number(otherText) || 0;
                          const pl = profitLoss ?? 0;
                          const values = [material, manpower, other, pl].map((v) => (v < 0 ? 0 : v));
                          const total = values.reduce((a, b) => a + b, 0);
                          if (!total || !Number.isFinite(total)) {
                            return (
                              <div className="w-full h-full flex items-center justify-center text-xs zynq-muted">
                                No chart data
                              </div>
                            );
                          }

                          const radius = 36;
                          const strokeWidth = 16;
                          const circumference = 2 * Math.PI * radius;
                          let offset = 0;
                          const colors = [
                            // light / dark variants
                            { light: '#3b82f6', dark: '#60a5fa' }, // Material - blue
                            { light: '#f97316', dark: '#fb923c' }, // Manpower - orange
                            { light: '#6b7280', dark: '#9ca3af' }, // Other - gray
                            { light: '#22c55e', dark: '#4ade80' }, // Profit/Loss - green
                          ];

                          const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

                          const segments = values.map((value, idx) => {
                            const fraction = value / total;
                            const length = fraction * circumference;
                            const { light: paletteLight, dark: paletteDark } =
                              colors[idx] ?? colors[colors.length - 1] ?? { light: '#ffffff', dark: '#ffffff' };
                            const seg = (
                              <circle
                                key={idx}
                                cx="50%"
                                cy="50%"
                                r={radius}
                                fill="transparent"
                                stroke={isDark ? paletteDark : paletteLight}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${length} ${circumference - length}`}
                                strokeDashoffset={-offset}
                              />
                            );
                            offset += length;
                            return seg;
                          });

                          return (
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                              <g transform="rotate(-90 50 50)">{segments}</g>
                              {/* inner hole */}
                              <circle cx="50" cy="50" r={radius - strokeWidth} fill="var(--surface)" />
                            </svg>
                          );
                        })()}
                      </div>

                      {/* Legend */}
                      <div className="flex-1 w-full space-y-2 text-sm">
                        {(() => {
                          const material = materialTotal || 0;
                          const manpower = manpowerGrandTotal || 0;
                          const other = otherText === '' ? 0 : Number(otherText) || 0;
                          const pl = profitLoss ?? 0;
                          const items = [
                            { label: 'Material Delivery', value: material, color: 'bg-blue-500 dark:bg-blue-400' },
                            { label: 'Manpower', value: manpower, color: 'bg-orange-500 dark:bg-orange-400' },
                            { label: 'Other', value: other, color: 'bg-gray-500 dark:bg-gray-400' },
                            { label: 'Profit/Loss', value: pl, color: 'bg-green-500 dark:bg-green-400' },
                          ];
                          const total = items
                            .map((i) => (i.value < 0 ? 0 : i.value))
                            .reduce((a, b) => a + b, 0);
                          if (!total || !Number.isFinite(total)) return null;

                          return items.map((item) => {
                            const safe = item.value < 0 ? 0 : item.value;
                            const pct = total ? (safe / total) * 100 : 0;
                            return (
                              <div key={item.label} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-block w-3 h-3 rounded-full ${item.color}`} />
                                  <span>{item.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="tabular-nums">
                                    {safe.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                  <span className="text-xs zynq-muted">{pct.toFixed(1)}%</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </IonContent>
    </IonPage>
  );
}

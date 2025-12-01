import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, useIonToast } from '@ionic/react';
import Nav from '../../components/Nav';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { fetchProjects, ProjectDto } from '../../api/projectsService';
import { fetchAttendance } from '../../api/hrService';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { fetchSiteDaySalaries, upsertSiteDaySalary, SiteDaySalaryDto } from '../../api/hrProjectSalaryService';
import { fetchManpowerRecords, ManpowerRecordDto } from '../../api/manpowerRecordsService';

export default function HRProjectWiseReport() {
  const [present] = useIonToast();
  const [projects, setProjects] = useState<ProjectDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [sitePresentMap, setSitePresentMap] = useState<Record<string, number>>({});
  const [siteHalfDayMap, setSiteHalfDayMap] = useState<Record<string, number>>({});
  const [siteOtMap, setSiteOtMap] = useState<Record<string, number>>({});
  const [siteSalaryMap, setSiteSalaryMap] = useState<Record<string, SiteDaySalaryDto>>({});
  const [editingSalary, setEditingSalary] = useState<Record<string, string>>({});
  const [savingSite, setSavingSite] = useState<string | null>(null);
  const [siteExternalLabourMap, setSiteExternalLabourMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    (async () => {
      try {
        // 1) Load projects (for Project/Site list)
        const projRes = await fetchProjects({ page: 1, pageSize: 1000, token } as any);
        const proj = projRes.data || [];
        setProjects(proj);

        // 2) Load all attendance (no date filter) and aggregate Present, Half day, and OT by site/location
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
            if (!site) continue;

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
        setSitePresentMap(presentCounts);
        setSiteHalfDayMap(halfDayCounts);
        setSiteOtMap(otSums);

        // 3) Load existing per-site day salaries
        const salaryRes = await fetchSiteDaySalaries({ token });
        const salaryRows = salaryRes.data || [];
        const salaryMap: Record<string, SiteDaySalaryDto> = {};
        for (const row of salaryRows) {
          const key = String(row.site || '').trim();
          if (!key) continue;
          // If multiple records accidentally exist, keep the last one; UI will still use a single value.
          salaryMap[key] = row;
        }
        setSiteSalaryMap(salaryMap);

        // 4) Load manpower supplier records and aggregate external labour totals per site
        const manpowerRecords: ManpowerRecordDto[] = (await fetchManpowerRecords({ token })) || [];
        const externalBySite: Record<string, number> = {};
        for (const r of manpowerRecords) {
          const siteName = String(r.site || '').trim();
          if (!siteName) continue;
          const totalVal = Number((r as any).total || 0);
          if (!Number.isFinite(totalVal) || totalVal === 0) continue;
          externalBySite[siteName] = (externalBySite[siteName] || 0) + totalVal;
        }
        setSiteExternalLabourMap(externalBySite);
      } catch (_) {
        setProjects((p) => p || []);
        setSitePresentMap({});
        setSiteHalfDayMap({});
        setSiteOtMap({});
        setSiteSalaryMap({});
        setSiteExternalLabourMap({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSaveSalary(siteNameRaw: string) {
    const siteName = siteNameRaw.trim();
    if (!siteName) return;
    const value = (editingSalary[siteName] ?? '').trim();
    const num = Number(value || (siteSalaryMap[siteName]?.daySalary ?? 0));
    if (Number.isNaN(num)) {
      present({ message: 'Invalid salary amount', color: 'danger', duration: 1800, position: 'top' });
      return;
    }
    const token = localStorage.getItem('token') || undefined;
    const existing = siteSalaryMap[siteName];
    try {
      setSavingSite(siteName);
      const saved = await upsertSiteDaySalary({
        id: existing?.id,
        site: siteName,
        projectId: existing?.projectId ?? null,
        daySalary: num,
        token,
      });
      setSiteSalaryMap((prev) => ({ ...prev, [siteName]: saved }));
      setEditingSalary((prev) => ({ ...prev, [siteName]: String(saved.daySalary) }));
      present({ message: 'Day salary saved', color: 'success', duration: 1500, position: 'top' });
    } catch (_) {
      present({ message: 'Failed to save day salary', color: 'danger', duration: 1800, position: 'top' });
    } finally {
      setSavingSite((prev) => (prev === siteName ? null : prev));
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="px-4 py-6 sm:px-6 lg:px-8 bg-[color:var(--bg)] space-y-6">
        <div className="text-lg font-semibold hidden lg:block">HR / Project-Wise Report</div>
        <div className="zynq-muted text-sm hidden lg:block">Home &gt; HR &gt; Project-Wise Report</div>
        <Card>
          <CardHeader>
            <CardTitle>Project-Wise Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm zynq-muted">
              This page is reserved for project-wise HR reporting. Implement report content here using the existing design system.
            </div>
            <div className="overflow-auto border border-[color:var(--border)] rounded-md">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-[color:var(--surface-soft)]">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold">Project</th>
                    <th className="px-3 py-2 font-semibold">Site</th>
                    <th className="px-3 py-2 font-semibold">Present</th>
                    <th className="px-3 py-2 font-semibold">Half day</th>
                    <th className="px-3 py-2 font-semibold">OT (HRS)</th>
                    <th className="px-3 py-2 font-semibold">Day Salary</th>
                    <th className="px-3 py-2 font-semibold">Total</th>
                    <th className="px-3 py-2 font-semibold">External Labours</th>
                    <th className="px-3 py-2 font-semibold">Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="border-t">
                      <td className="px-3 py-2 text-gray-500" colSpan={9}>
                        Loading projects...
                      </td>
                    </tr>
                  ) : !projects || projects.length === 0 ? (
                    <tr className="border-t">
                      <td className="px-3 py-2 text-gray-500" colSpan={9}>
                        No projects found.
                      </td>
                    </tr>
                  ) : (
                    projects.map((p) => {
                      const siteName = (p.site || '').trim();
                      const presentCount = siteName ? sitePresentMap[siteName] || 0 : 0;
                      const halfDayCount = siteName ? siteHalfDayMap[siteName] || 0 : 0;
                      const otSum = siteName ? siteOtMap[siteName] || 0 : 0;
                      const salaryRow = siteName ? siteSalaryMap[siteName] : undefined;
                      const salaryValue = siteName
                        ? editingSalary[siteName] ?? (salaryRow ? String(salaryRow.daySalary) : '')
                        : '';
                      const daySalaryNumber = siteName ? (salaryRow ? Number(salaryRow.daySalary || 0) : 0) : 0;
                      const externalLabours = siteName ? siteExternalLabourMap[siteName] || 0 : 0;
                      const totalInternal = siteName
                        ? daySalaryNumber * (presentCount + halfDayCount * 0.5 + otSum)
                        : 0;
                      const grandTotal = siteName ? totalInternal + externalLabours : 0;
                      const isSaving = savingSite === siteName;
                      return (
                        <tr key={p.id} className="border-t">
                          <td className="px-3 py-2">{p.name}</td>
                          <td className="px-3 py-2">{siteName || '—'}</td>
                          <td className="px-3 py-2">{siteName ? presentCount : '—'}</td>
                          <td className="px-3 py-2">{siteName ? halfDayCount : '—'}</td>
                          <td className="px-3 py-2">{siteName ? otSum : '—'}</td>
                          <td className="px-3 py-2">
                            {siteName ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  label=""
                                  type="number"
                                  value={salaryValue}
                                  onChange={(e: any) => {
                                    const v = (e.target as HTMLInputElement).value;
                                    setEditingSalary((prev) => ({ ...prev, [siteName]: v }));
                                  }}
                                  className="h-8 text-xs w-24"
                                />
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={isSaving}
                                  onClick={() => handleSaveSalary(siteName)}
                                >
                                  {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-3 py-2">{siteName ? totalInternal.toFixed(2) : '—'}</td>
                          <td className="px-3 py-2">{siteName ? externalLabours.toFixed(2) : '—'}</td>
                          <td className="px-3 py-2">{siteName ? grandTotal.toFixed(2) : '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </IonContent>
    </IonPage>
  );
}

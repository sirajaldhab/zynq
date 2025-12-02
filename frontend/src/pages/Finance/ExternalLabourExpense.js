import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonIcon, useIonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Table from '../../ui/Table';
import Input from '../../ui/Input';
import { chevronBackOutline } from 'ionicons/icons';
import { fetchManpowerRecords } from '../../api/manpowerRecordsService';
import { fetchVendors } from '../../api/vendorsService';
import { fetchExternalLabourExpenses, upsertExternalLabourExpense } from '../../api/externalLabourExpenseService';
import { useAuth } from '../../auth/AuthContext';
export default function ExternalLabourExpensePage() {
    const navigate = useNavigate();
    const [present] = useIonToast();
    const { role } = useAuth();
    const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [savingId, setSavingId] = React.useState(null);
    const [supplierFilter, setSupplierFilter] = React.useState('all');
    // Recalculate PM Balance + Balance chain for a single supplier across all months
    const recalcChainForSupplier = React.useCallback(async (vendorId) => {
        const token = localStorage.getItem('token') || undefined;
        // Work on a copy of rows for this supplier, sorted by month ASC to compute chain
        setRows((current) => {
            const supplierRows = current
                .filter((r) => r.vendorId === vendorId)
                .slice()
                .sort((a, b) => (a.monthKey === b.monthKey ? 0 : a.monthKey < b.monthKey ? -1 : 1));
            let prevBalance = 0;
            const updatedByKey = new Map();
            for (const r of supplierRows) {
                const pmBalance = prevBalance;
                const balance = r.total + pmBalance - r.paidAmount;
                const updated = {
                    ...r,
                    pmBalance,
                    balance,
                };
                prevBalance = balance;
                updatedByKey.set(`${r.vendorId}__${r.monthKey}`, updated);
            }
            const next = current.map((r) => {
                if (r.vendorId !== vendorId)
                    return r;
                const key = `${r.vendorId}__${r.monthKey}`;
                return updatedByKey.get(key) || r;
            });
            // Only update local state; persistence is handled explicitly by the Save button
            return next;
        });
    }, []);
    React.useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            try {
                setLoading(true);
                // 1) Load vendors, manpower records (HR source), and existing external labour expenses
                const [vendorsRes, recordsRes, savedRes] = await Promise.all([
                    fetchVendors({ token }),
                    fetchManpowerRecords({ token }),
                    fetchExternalLabourExpenses({ token }),
                ]);
                const vendors = vendorsRes || [];
                const records = recordsRes || [];
                const saved = savedRes || [];
                const vendorById = new Map();
                vendors.forEach((v) => vendorById.set(v.id, v));
                // 2) Build base monthly summary per supplier + month from manpower records
                const monthlyMap = new Map();
                for (const r of records) {
                    const vendorId = (r.vendorId || '').trim();
                    if (!vendorId)
                        continue;
                    const vendor = vendorById.get(vendorId);
                    const supplierName = vendor?.name || vendorId;
                    const rawDate = r.date || r.createdAt;
                    if (!rawDate)
                        continue;
                    const d = new Date(rawDate);
                    if (Number.isNaN(d.getTime()))
                        continue;
                    // Derive strict YYYY-MM for grouping, no manual 0-based month arithmetic
                    const year = d.getFullYear();
                    const monthNum = d.getMonth() + 1; // 1-12
                    const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`; // e.g. 2025-11
                    const monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                    const key = `${monthKey}__${vendorId}`;
                    let row = monthlyMap.get(key);
                    if (!row) {
                        row = {
                            monthLabel,
                            monthKey,
                            vendorId,
                            supplierName,
                            totalLabour: 0,
                            total: 0,
                            pmBalance: 0,
                            paidAmount: 0,
                            balance: 0,
                            notes: '',
                        };
                        monthlyMap.set(key, row);
                    }
                    row.totalLabour += Number(r.totalLabour || 0);
                    row.total += Number(r.total || 0);
                }
                // 3) Overlay saved external labour expenses (paidAmount, pmBalance, balance, notes)
                for (const s of saved) {
                    const vendorId = (s.vendorId || '').trim();
                    if (!vendorId)
                        continue;
                    if (!s.month)
                        continue;
                    const monthDate = new Date(s.month);
                    if (Number.isNaN(monthDate.getTime()))
                        continue;
                    const year = monthDate.getFullYear();
                    const monthNum = monthDate.getMonth() + 1;
                    const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
                    const key = `${monthKey}__${vendorId}`;
                    const base = monthlyMap.get(key);
                    if (!base) {
                        // If there is a saved finance row without HR records, still show it.
                        const supplierName = s.vendor?.name || vendorById.get(vendorId)?.name || vendorId;
                        monthlyMap.set(key, {
                            monthLabel: monthDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
                            monthKey,
                            vendorId,
                            supplierName,
                            totalLabour: Number(s.totalLabour || 0),
                            total: Number(s.total || 0),
                            pmBalance: Number(s.pmBalance || 0),
                            paidAmount: Number(s.paidAmount || 0),
                            balance: Number(s.balance || 0),
                            notes: s.notes || '',
                            id: s.id,
                        });
                    }
                    else {
                        base.pmBalance = Number(s.pmBalance || 0);
                        base.paidAmount = Number(s.paidAmount || 0);
                        base.balance = Number(s.balance || 0);
                        base.notes = s.notes || '';
                        base.id = s.id;
                    }
                }
                const list = Array.from(monthlyMap.values());
                // Sort by supplier, then by month DESC so latest month appears on top
                list.sort((a, b) => {
                    if (a.supplierName !== b.supplierName)
                        return a.supplierName.localeCompare(b.supplierName);
                    if (a.monthKey === b.monthKey)
                        return 0;
                    return a.monthKey > b.monthKey ? -1 : 1;
                });
                setRows(list);
            }
            catch (e) {
                setRows([]);
                present({ message: 'Failed to load external labour expenses.', color: 'danger', duration: 2000, position: 'top' });
            }
            finally {
                setLoading(false);
            }
        })();
    }, [present]);
    const columns = [
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
        {
            key: 'pmBalance',
            header: 'PM Balance',
            render: (row) => Number(row.pmBalance || 0).toLocaleString(),
        },
        {
            key: 'paidAmount',
            header: 'Paid Amount',
            render: (row) => (_jsx(Input, { type: "number", value: String(row.paidAmount ?? 0), onChange: (e) => {
                    const value = e.target.value;
                    setRows((prev) => prev.map((r) => r.vendorId === row.vendorId && r.monthKey === row.monthKey
                        ? { ...r, paidAmount: Number(value || 0) }
                        : r));
                }, disabled: isTeamLeader })),
        },
        {
            key: 'balance',
            header: 'Balance',
            render: (row) => {
                const balance = Number(row.total + row.pmBalance - row.paidAmount);
                const cls = balance < 0
                    ? 'text-[color:var(--danger)]'
                    : balance > 0
                        ? 'text-[color:var(--success)]'
                        : '';
                return _jsx("span", { className: cls, children: balance.toLocaleString() });
            },
        },
        {
            key: 'notes',
            header: 'Notes',
            render: (row) => (_jsx(Input, { value: row.notes || '', onChange: (e) => {
                    const value = e.target.value;
                    setRows((prev) => prev.map((r) => r.vendorId === row.vendorId && r.monthKey === row.monthKey ? { ...r, notes: value } : r));
                }, disabled: isTeamLeader })),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (row) => (!isTeamLeader ? (_jsx(Button, { size: "sm", variant: "secondary", disabled: savingId === `${row.vendorId}__${row.monthKey}`, onClick: async () => {
                    const saveKey = `${row.vendorId}__${row.monthKey}`;
                    setSavingId(saveKey);
                    try {
                        const saved = await upsertExternalLabourExpense({
                            vendorId: row.vendorId,
                            month: row.monthKey,
                            totalLabour: row.totalLabour,
                            total: row.total,
                            paidAmount: row.paidAmount,
                            notes: row.notes,
                        });
                        setRows((prev) => prev.map((r) => {
                            if (r.vendorId === row.vendorId && r.monthKey === row.monthKey) {
                                const monthDate = new Date(saved.month);
                                const year = monthDate.getFullYear();
                                const monthNum = monthDate.getMonth() + 1;
                                const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
                                return {
                                    ...r,
                                    id: saved.id,
                                    monthKey,
                                    pmBalance: Number(saved.pmBalance || 0),
                                    paidAmount: Number(saved.paidAmount || 0),
                                    balance: Number(saved.balance || 0),
                                    notes: saved.notes || '',
                                };
                            }
                            return r;
                        }));
                        present({ message: 'Saved.', color: 'success', duration: 1500, position: 'top' });
                        // After saving this month, recompute the full chain for this supplier
                        await recalcChainForSupplier(row.vendorId);
                    }
                    catch (e) {
                        const msg = e?.message || e?.error || 'Failed to save.';
                        present({ message: msg, color: 'danger', duration: 2000, position: 'top' });
                    }
                    finally {
                        setSavingId(null);
                    }
                }, children: "Save" })) : null),
        },
    ];
    // Compute summary totals based on current filter
    const filteredRows = React.useMemo(() => rows.filter((r) => supplierFilter === 'all' || r.vendorId === supplierFilter), [rows, supplierFilter]);
    const totalAmount = React.useMemo(() => filteredRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0), [filteredRows]);
    const totalPaid = React.useMemo(() => filteredRows.reduce((sum, r) => sum + (Number(r.paidAmount) || 0), 0), [filteredRows]);
    const totalBalance = React.useMemo(() => (totalAmount || 0) - (totalPaid || 0), [totalAmount, totalPaid]);
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "text-lg font-semibold", children: "Finance / Expenses / Manpower / External Labour Expense" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Finance > Expenses > Manpower > External Labour Expense" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/finance/expenses/manpower'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs("div", { className: "mt-6 grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "border border-[color:var(--border)] rounded-lg px-4 py-3 bg-[color:var(--card-bg,rgba(255,255,255,0.02))]", children: [_jsx("div", { className: "text-xs zynq-muted", children: "Total" }), _jsx("div", { className: "text-lg font-semibold", children: totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })] }), _jsxs("div", { className: "border border-[color:var(--border)] rounded-lg px-4 py-3 bg-[color:var(--card-bg,rgba(255,255,255,0.02))]", children: [_jsx("div", { className: "text-xs zynq-muted", children: "Paid Amount" }), _jsx("div", { className: "text-lg font-semibold text-[color:var(--danger)]", children: totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })] }), _jsxs("div", { className: "border border-[color:var(--border)] rounded-lg px-4 py-3 bg-[color:var(--card-bg,rgba(255,255,255,0.02))]", children: [_jsx("div", { className: "text-xs zynq-muted", children: "Balance" }), _jsx("div", { className: `text-lg font-semibold ${totalBalance < 0
                                                ? 'text-[color:var(--danger)]'
                                                : 'text-[color:var(--success)]'}`, children: totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })] })] }), _jsx("div", { className: "mt-4 flex flex-wrap items-center gap-4", children: _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "zynq-muted", children: "Manpower Supplier:" }), _jsxs("select", { className: "bg-[color:var(--card-bg,rgba(255,255,255,0.02))] border border-[color:var(--border)] rounded px-2 py-1 text-sm", value: supplierFilter, onChange: (e) => setSupplierFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All" }), Array.from(rows
                                                .reduce((set, r) => {
                                                if (!set.has(r.vendorId))
                                                    set.add(r.vendorId);
                                                return set;
                                            }, new Set())).map((vendorId) => {
                                                const sample = rows.find((r) => r.vendorId === vendorId);
                                                if (!sample)
                                                    return null;
                                                return (_jsx("option", { value: vendorId, children: sample.supplierName }, vendorId));
                                            })] })] }) }), _jsxs("div", { className: "mt-4 space-y-6", children: [loading && rows.length === 0 ? (_jsx("div", { className: "zynq-muted text-sm", children: "Loading..." })) : null, !loading && rows.length === 0 ? (_jsx("div", { className: "zynq-muted text-sm", children: "No data" })) : null, Object.values(rows
                                    .filter((row) => supplierFilter === 'all' || row.vendorId === supplierFilter)
                                    .reduce((acc, row) => {
                                    const key = row.monthKey || 'unknown';
                                    if (!acc[key]) {
                                        acc[key] = {
                                            monthKey: key,
                                            monthLabel: row.monthLabel || key,
                                            items: [],
                                        };
                                    }
                                    acc[key].items.push(row);
                                    return acc;
                                }, {}))
                                    .sort((a, b) => {
                                    // Sort month groups so latest month card appears first using strict YYYY-MM
                                    if (a.monthKey === b.monthKey)
                                        return 0;
                                    return a.monthKey > b.monthKey ? -1 : 1;
                                })
                                    .map((group) => (_jsxs("div", { className: "border border-[color:var(--border)] rounded-lg bg-[color:var(--card-bg,rgba(255,255,255,0.02))]", children: [_jsxs("div", { className: "px-4 py-2 border-b border-[color:var(--border)] flex items-center justify-between", children: [_jsx("div", { className: "font-semibold", children: group.monthLabel }), _jsx("div", { className: "text-xs zynq-muted", children: "External Labour Expense" })] }), _jsx("div", { className: "p-4", children: _jsx(Table, { columns: columns, data: group.items, emptyText: "No suppliers for this month" }) })] }, group.monthKey)))] })] }) })] }));
}

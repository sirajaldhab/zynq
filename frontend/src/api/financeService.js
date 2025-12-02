import { apiFetch } from './client';
export async function fetchInvoices(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.clientId)
        q.set('clientId', params.clientId);
    if (params.status && params.status !== 'All')
        q.set('status', params.status);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.search)
        q.set('search', params.search);
    if (params.sortKey)
        q.set('sortKey', params.sortKey);
    if (params.sortDir)
        q.set('sortDir', params.sortDir);
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    return apiFetch(`/invoices?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function exportInvoicesCsv(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.clientId)
        q.set('clientId', params.clientId);
    if (params.status && params.status !== 'All')
        q.set('status', params.status);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.search)
        q.set('search', params.search);
    q.set('export', 'csv');
    return apiFetch(`/invoices?${q.toString()}`, { token: params.token, retries: 1 });
}
export async function bulkCreateInvoices(body) {
    const token = body[0]?.token;
    const payload = body.map(({ token: _t, ...r }) => r);
    return apiFetch(`/invoices/bulk`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 });
}
export async function fetchPayments(params) {
    const q = new URLSearchParams();
    if (params.invoiceId)
        q.set('invoiceId', params.invoiceId);
    if (params.expenseId)
        q.set('expenseId', params.expenseId);
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.method)
        q.set('method', params.method);
    if (params.search)
        q.set('search', params.search);
    if (params.sortKey)
        q.set('sortKey', params.sortKey);
    if (params.sortDir)
        q.set('sortDir', params.sortDir);
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    return apiFetch(`/payments?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function exportPaymentsCsv(params) {
    const q = new URLSearchParams();
    if (params.invoiceId)
        q.set('invoiceId', params.invoiceId);
    if (params.expenseId)
        q.set('expenseId', params.expenseId);
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.method)
        q.set('method', params.method);
    if (params.search)
        q.set('search', params.search);
    q.set('export', 'csv');
    return apiFetch(`/payments?${q.toString()}`, { token: params.token, retries: 1 });
}
export async function bulkCreatePayments(body) {
    const token = body[0]?.token;
    const payload = body.map(({ token: _t, ...r }) => r);
    return apiFetch(`/payments/bulk`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 });
}
export async function getExpensesTotal(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.vendorId)
        q.set('vendorId', params.vendorId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.search)
        q.set('search', params.search);
    return apiFetch(`/expenses/aggregate/total?${q.toString()}`, { token: params.token, retries: 1 });
}
export async function getUnifiedExpensesTotal(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    return apiFetch(`/expenses/aggregate/unified-total?${q.toString()}`, { token: params.token, retries: 1 });
}
export async function getPaymentsTotal(params) {
    const q = new URLSearchParams();
    if (params.invoiceId)
        q.set('invoiceId', params.invoiceId);
    if (params.expenseId)
        q.set('expenseId', params.expenseId);
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.method)
        q.set('method', params.method);
    if (params.search)
        q.set('search', params.search);
    return apiFetch(`/payments/aggregate/total?${q.toString()}`, { token: params.token, retries: 1 });
}
export async function getInvoicesReceivedTotal(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    return apiFetch(`/invoices/aggregate/received-total?${q.toString()}`, { token: params.token, retries: 1 });
}
// Invoices CRUD
export async function createInvoice(params, body) {
    // TODO: add offline queue to RxDB when network unavailable
    return apiFetch(`/invoices`, {
        method: 'POST',
        body: JSON.stringify(body),
        token: params.token,
        retries: 1,
    });
}
export async function updateInvoice(params, body) {
    // TODO: record change for conflict resolution on next sync
    return apiFetch(`/invoices/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        token: params.token,
        retries: 1,
    });
}
export async function deleteInvoice(params) {
    // TODO: tombstone locally and replicate to backend on reconnect
    return apiFetch(`/invoices/${params.id}`, {
        method: 'DELETE',
        token: params.token,
        retries: 1,
    });
}
// Payments (basic create/delete for now)
export async function createPayment(body) {
    return apiFetch(`/payments`, {
        method: 'POST',
        body: JSON.stringify(body),
        token: body.token,
        retries: 1,
    });
}
export async function deletePayment(params) {
    return apiFetch(`/payments/${params.id}`, {
        method: 'DELETE',
        token: params.token,
        retries: 1,
    });
}
export async function updatePayment(params, body) {
    return apiFetch(`/payments/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        token: params.token,
        retries: 1,
    });
}
export async function fetchExpenses(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.vendorId)
        q.set('vendorId', params.vendorId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.search)
        q.set('search', params.search);
    if (params.sortKey)
        q.set('sortKey', params.sortKey);
    if (params.sortDir)
        q.set('sortDir', params.sortDir);
    if (params.page)
        q.set('page', String(params.page));
    if (params.pageSize)
        q.set('pageSize', String(params.pageSize));
    return apiFetch(`/expenses?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createExpense(body) {
    return apiFetch(`/expenses`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 });
}
export async function updateExpense(params, body) {
    return apiFetch(`/expenses/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
export async function deleteExpense(params) {
    return apiFetch(`/expenses/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 });
}
export async function bulkCreateExpenses(body) {
    const token = body[0]?.token;
    const payload = body.map(({ token: _t, ...r }) => r);
    return apiFetch(`/expenses/bulk`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 });
}
export async function exportExpensesCsv(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.vendorId)
        q.set('vendorId', params.vendorId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.search)
        q.set('search', params.search);
    q.set('export', 'csv');
    return apiFetch(`/expenses?${q.toString()}`, { token: params.token, retries: 1 });
}
export async function fetchGeneralExpenses(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.vendorId)
        q.set('vendorId', params.vendorId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.search)
        q.set('search', params.search);
    if (params.sortKey)
        q.set('sortKey', params.sortKey);
    if (params.sortDir)
        q.set('sortDir', params.sortDir);
    if (params.page)
        q.set('page', String(params.page));
    if (params.pageSize)
        q.set('pageSize', String(params.pageSize));
    return apiFetch(`/general-expenses?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createGeneralExpense(body) {
    return apiFetch(`/general-expenses`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 });
}
export async function updateGeneralExpense(params, body) {
    return apiFetch(`/general-expenses/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
export async function deleteGeneralExpense(params) {
    return apiFetch(`/general-expenses/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 });
}
export async function bulkCreateGeneralExpenses(body) {
    const token = body[0]?.token;
    const payload = body.map(({ token: _t, ...r }) => r);
    return apiFetch(`/general-expenses/bulk`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 });
}
export async function exportGeneralExpensesCsv(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.vendorId)
        q.set('vendorId', params.vendorId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.search)
        q.set('search', params.search);
    q.set('export', 'csv');
    return apiFetch(`/general-expenses?${q.toString()}`, { token: params.token, retries: 1 });
}
export async function fetchBudgets(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.search)
        q.set('search', params.search);
    if (params.page)
        q.set('page', String(params.page));
    if (params.pageSize)
        q.set('pageSize', String(params.pageSize));
    return apiFetch(`/budgets?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createBudget(body) {
    return apiFetch(`/budgets`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 });
}
export async function updateBudget(params, body) {
    return apiFetch(`/budgets/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
export async function deleteBudget(params) {
    return apiFetch(`/budgets/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 });
}
export async function exportBudgetsCsv(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.dateFrom)
        q.set('dateFrom', params.dateFrom);
    if (params.dateTo)
        q.set('dateTo', params.dateTo);
    if (params.search)
        q.set('search', params.search);
    q.set('export', 'csv');
    return apiFetch(`/budgets?${q.toString()}`, { token: params.token, retries: 1 });
}
export async function bulkCreateBudgets(body) {
    const token = body[0]?.token;
    const payload = body.map(({ token: _t, ...r }) => r);
    return apiFetch(`/budgets/bulk`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 });
}

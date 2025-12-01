import { apiFetch, ApiResult } from './client';

export type InvoiceDto = { id: string; projectId: string; clientId: string; invoice_no?: string; invoice_date: string; due_date?: string; subtotal: number; vat: number; total: number; status?: string };
export type PaymentDto = { id: string; invoiceId?: string | null; expenseId?: string | null; projectId?: string | null; payment_date: string; method?: string | null; reference?: string | null; amount: number };

export async function fetchInvoices(params: { projectId?: string; clientId?: string; status?: string; dateFrom?: string; dateTo?: string; search?: string; sortKey?: string; sortDir?: 'asc'|'desc'; page: number; pageSize: number; token?: string; }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.clientId) q.set('clientId', params.clientId);
  if (params.status && params.status !== 'All') q.set('status', params.status);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.search) q.set('search', params.search);
  if (params.sortKey) q.set('sortKey', params.sortKey);
  if (params.sortDir) q.set('sortDir', params.sortDir);
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  return apiFetch<{ rows?: InvoiceDto[]; total?: number; page?: number; pageSize?: number } | ApiResult<InvoiceDto[]>>(`/invoices?${q.toString()}`, { token: params.token, retries: 2 }) as any;
}

export async function exportInvoicesCsv(params: { projectId?: string; clientId?: string; status?: string; dateFrom?: string; dateTo?: string; search?: string; token?: string }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.clientId) q.set('clientId', params.clientId);
  if (params.status && params.status !== 'All') q.set('status', params.status);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.search) q.set('search', params.search);
  q.set('export', 'csv');
  return apiFetch<string>(`/invoices?${q.toString()}`, { token: params.token, retries: 1 } as any);
}

export async function bulkCreateInvoices(body: Array<{ projectId: string; clientId: string; invoice_date: string; due_date?: string; items_json: any; subtotal: number; vat: number; total: number; status?: string } & { token?: string }>) {
  const token = (body as any)[0]?.token as string | undefined;
  const payload = body.map(({ token: _t, ...r }) => r);
  return apiFetch<{ count: number }>(`/invoices/bulk`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 } as any);
}

export async function fetchPayments(params: { invoiceId?: string; expenseId?: string; projectId?: string; dateFrom?: string; dateTo?: string; method?: string; search?: string; sortKey?: string; sortDir?: 'asc'|'desc'; page: number; pageSize: number; token?: string }) {
  const q = new URLSearchParams();
  if (params.invoiceId) q.set('invoiceId', params.invoiceId);
  if (params.expenseId) q.set('expenseId', params.expenseId);
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.method) q.set('method', params.method);
  if (params.search) q.set('search', params.search);
  if (params.sortKey) q.set('sortKey', params.sortKey);
  if (params.sortDir) q.set('sortDir', params.sortDir);
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  return apiFetch<{ rows?: PaymentDto[]; total?: number; page?: number; pageSize?: number } | ApiResult<PaymentDto[]>>(`/payments?${q.toString()}`, { token: params.token, retries: 2 }) as any;
}

export async function exportPaymentsCsv(params: { invoiceId?: string; expenseId?: string; projectId?: string; dateFrom?: string; dateTo?: string; method?: string; search?: string; token?: string }) {
  const q = new URLSearchParams();
  if (params.invoiceId) q.set('invoiceId', params.invoiceId);
  if (params.expenseId) q.set('expenseId', params.expenseId);
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.method) q.set('method', params.method);
  if (params.search) q.set('search', params.search);
  q.set('export', 'csv');
  return apiFetch<string>(`/payments?${q.toString()}`, { token: params.token, retries: 1 } as any);
}

export async function bulkCreatePayments(body: Array<{ invoiceId?: string; expenseId?: string; projectId?: string; amount: number; payment_date: string; method?: string; reference?: string } & { token?: string }>) {
  const token = (body as any)[0]?.token as string | undefined;
  const payload = body.map(({ token: _t, ...r }) => r);
  return apiFetch<{ count: number }>(`/payments/bulk`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 } as any);
}

export async function getExpensesTotal(params: { projectId?: string; vendorId?: string; dateFrom?: string; dateTo?: string; search?: string; token?: string }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.vendorId) q.set('vendorId', params.vendorId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.search) q.set('search', params.search);
  return apiFetch<{ totalAmount: number }>(`/expenses/aggregate/total?${q.toString()}`, { token: params.token, retries: 1 } as any);
}

export async function getUnifiedExpensesTotal(params: { projectId?: string; dateFrom?: string; dateTo?: string; token?: string }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  return apiFetch<{ totalAmount: number }>(`/expenses/aggregate/unified-total?${q.toString()}`, { token: params.token, retries: 1 } as any);
}

export async function getPaymentsTotal(params: { invoiceId?: string; expenseId?: string; projectId?: string; dateFrom?: string; dateTo?: string; method?: string; search?: string; token?: string }) {
  const q = new URLSearchParams();
  if (params.invoiceId) q.set('invoiceId', params.invoiceId);
  if (params.expenseId) q.set('expenseId', params.expenseId);
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.method) q.set('method', params.method);
  if (params.search) q.set('search', params.search);
  return apiFetch<{ totalAmount: number }>(`/payments/aggregate/total?${q.toString()}`, { token: params.token, retries: 1 } as any);
}

export async function getInvoicesReceivedTotal(params: { projectId?: string; dateFrom?: string; dateTo?: string; token?: string }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  return apiFetch<{ totalAmount: number }>(`/invoices/aggregate/received-total?${q.toString()}`, { token: params.token, retries: 1 } as any);
}

// Invoices CRUD
export async function createInvoice(params: { token?: string }, body: { projectId: string; clientId: string; invoice_no?: string; invoice_date: string; due_date?: string; items_json: any; subtotal: number; vat: number; total: number; status?: string }) {
  // TODO: add offline queue to RxDB when network unavailable
  return apiFetch<any>(`/invoices`, {
    method: 'POST',
    body: JSON.stringify(body),
    token: params.token,
    retries: 1,
  } as any);
}

export async function updateInvoice(params: { id: string; token?: string }, body: Partial<{ projectId: string; invoice_no?: string; invoice_date: string; due_date?: string; items_json: any; subtotal: number; vat: number; total: number; status?: string }>) {
  // TODO: record change for conflict resolution on next sync
  return apiFetch<any>(`/invoices/${params.id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    token: params.token,
    retries: 1,
  } as any);
}

export async function deleteInvoice(params: { id: string; token?: string }) {
  // TODO: tombstone locally and replicate to backend on reconnect
  return apiFetch<any>(`/invoices/${params.id}`, {
    method: 'DELETE',
    token: params.token,
    retries: 1,
  } as any);
}

// Payments (basic create/delete for now)
export async function createPayment(body: { invoiceId?: string; expenseId?: string; projectId?: string; amount: number; payment_date: string; method?: string; reference?: string; token?: string }) {
  return apiFetch<any>(`/payments`, {
    method: 'POST',
    body: JSON.stringify(body),
    token: body.token,
    retries: 1,
  } as any);
}

export async function deletePayment(params: { id: string; token?: string }) {
  return apiFetch<any>(`/payments/${params.id}`, {
    method: 'DELETE',
    token: params.token,
    retries: 1,
  } as any);
}

export async function updatePayment(params: { id: string; token?: string }, body: Partial<{ amount: number; payment_date: string; method?: string; reference?: string }>) {
  return apiFetch<any>(`/payments/${params.id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    token: params.token,
    retries: 1,
  } as any);
}

// Expenses
export type ExpenseDto = { id: string; projectId?: string; vendorId?: string; date: string; amount: number; category: string; note?: string };
export async function fetchExpenses(params: { projectId?: string; vendorId?: string; dateFrom?: string; dateTo?: string; search?: string; sortKey?: string; sortDir?: 'asc'|'desc'; page?: number; pageSize?: number; token?: string }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.vendorId) q.set('vendorId', params.vendorId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.search) q.set('search', params.search);
  if (params.sortKey) q.set('sortKey', params.sortKey);
  if (params.sortDir) q.set('sortDir', params.sortDir);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return apiFetch<{ rows?: ExpenseDto[]; total?: number; page?: number; pageSize?: number } | ApiResult<ExpenseDto[]>>(`/expenses?${q.toString()}`, { token: params.token, retries: 2 }) as any;
}
export async function createExpense(body: { projectId?: string; vendorId?: string; date: string; amount: number; category: string; note?: string; token?: string }) {
  return apiFetch<ExpenseDto>(`/expenses`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 } as any);
}
export async function updateExpense(params: { id: string; token?: string }, body: Partial<{ projectId?: string; vendorId?: string; date: string; amount: number; category: string; note?: string }>) {
  return apiFetch<ExpenseDto>(`/expenses/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any);
}
export async function deleteExpense(params: { id: string; token?: string }) {
  return apiFetch<any>(`/expenses/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 } as any);
}
export async function bulkCreateExpenses(body: Array<{ projectId?: string; vendorId?: string; date: string; amount: number; category: string; note?: string } & { token?: string }>) {
  const token = (body as any)[0]?.token as string | undefined;
  const payload = body.map(({ token: _t, ...r }) => r);
  return apiFetch<{ count: number }>(`/expenses/bulk`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 } as any);
}
export async function exportExpensesCsv(params: { projectId?: string; vendorId?: string; dateFrom?: string; dateTo?: string; search?: string; token?: string }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.vendorId) q.set('vendorId', params.vendorId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.search) q.set('search', params.search);
  q.set('export', 'csv');
  return apiFetch<string>(`/expenses?${q.toString()}`, { token: params.token, retries: 1 } as any);
}

// General Expenses (separate endpoint)
export type GeneralExpenseDto = ExpenseDto;
export async function fetchGeneralExpenses(params: { projectId?: string; vendorId?: string; dateFrom?: string; dateTo?: string; search?: string; sortKey?: string; sortDir?: 'asc'|'desc'; page?: number; pageSize?: number; token?: string }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.vendorId) q.set('vendorId', params.vendorId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.search) q.set('search', params.search);
  if (params.sortKey) q.set('sortKey', params.sortKey);
  if (params.sortDir) q.set('sortDir', params.sortDir);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return apiFetch<{ rows?: GeneralExpenseDto[]; total?: number; page?: number; pageSize?: number } | ApiResult<GeneralExpenseDto[]>>(`/general-expenses?${q.toString()}`, { token: params.token, retries: 2 }) as any;
}
export async function createGeneralExpense(body: { projectId?: string; vendorId?: string; date: string; amount: number; note?: string; token?: string }) {
  return apiFetch<GeneralExpenseDto>(`/general-expenses`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 } as any);
}
export async function updateGeneralExpense(params: { id: string; token?: string }, body: Partial<{ projectId?: string; vendorId?: string; date: string; amount: number; note?: string }>) {
  return apiFetch<GeneralExpenseDto>(`/general-expenses/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any);
}
export async function deleteGeneralExpense(params: { id: string; token?: string }) {
  return apiFetch<any>(`/general-expenses/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 } as any);
}
export async function bulkCreateGeneralExpenses(body: Array<{ projectId?: string; vendorId?: string; date: string; amount: number; note?: string } & { token?: string }>) {
  const token = (body as any)[0]?.token as string | undefined;
  const payload = body.map(({ token: _t, ...r }) => r);
  return apiFetch<{ count: number }>(`/general-expenses/bulk`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 } as any);
}
export async function exportGeneralExpensesCsv(params: { projectId?: string; vendorId?: string; dateFrom?: string; dateTo?: string; search?: string; token?: string }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.vendorId) q.set('vendorId', params.vendorId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.search) q.set('search', params.search);
  q.set('export', 'csv');
  return apiFetch<string>(`/general-expenses?${q.toString()}`, { token: params.token, retries: 1 } as any);
}

// Budgets
export type BudgetDto = { id: string; projectId: string; periodStart: string; periodEnd: string; amount: number; spent: number; category?: string };
export async function fetchBudgets(params: { projectId?: string; dateFrom?: string; dateTo?: string; search?: string; page?: number; pageSize?: number; token?: string }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return apiFetch<ApiResult<BudgetDto[]>>(`/budgets?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createBudget(body: { projectId: string; periodStart: string; periodEnd: string; amount: number; spent?: number; category?: string; token?: string }) {
  return apiFetch<BudgetDto>(`/budgets`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 } as any);
}
export async function updateBudget(params: { id: string; token?: string }, body: Partial<{ periodStart: string; periodEnd: string; amount: number; spent: number; category?: string }>) {
  return apiFetch<BudgetDto>(`/budgets/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any);
}
export async function deleteBudget(params: { id: string; token?: string }) {
  return apiFetch<any>(`/budgets/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 } as any);
}

export async function exportBudgetsCsv(params: { projectId?: string; dateFrom?: string; dateTo?: string; search?: string; token?: string }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.search) q.set('search', params.search);
  q.set('export', 'csv');
  return apiFetch<string>(`/budgets?${q.toString()}`, { token: params.token, retries: 1 } as any);
}

export async function bulkCreateBudgets(body: Array<{ projectId: string; periodStart: string; periodEnd: string; amount: number; spent?: number; category?: string } & { token?: string }>) {
  const token = (body as any)[0]?.token as string | undefined;
  const payload = body.map(({ token: _t, ...r }) => r);
  return apiFetch<{ count: number }>(`/budgets/bulk`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 } as any);
}

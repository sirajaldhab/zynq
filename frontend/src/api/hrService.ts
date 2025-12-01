import { apiFetch, ApiResult } from './client';

// Attendance records as returned by the backend. The API is slightly inconsistent
// in field casing (check_in vs checkIn), so we support both for convenience.
export type AttendanceDto = {
  id: string;
  employeeId?: string;
  status?: string;
  location?: string | null;
  // Possible date/time field names
  date?: string;
  checkIn?: string;
  checkOut?: string;
  check_in?: string;
  check_out?: string;
  // Optional OT and Signature persisted on Attendance
  otHours?: number | null;
  signature?: string | null;
  // Joined employee (when include: { employee: true })
  employee?: {
    id?: string;
    emiratesId?: string | null;
  };
  // Some responses may flatten emiratesId
  emiratesId?: string | null;
};
export type RosterDto = { id: string; employee: string; role: string; shift: 'Morning'|'Evening'|'Night'; team: string };
export type EmployeeDto = {
  id: string;
  company: string;
  employeeName: string;
  dateOfJoining: string;
  emiratesId: string;
  labourCardNo?: string;
  mobileNo: string;
  bankAccountNo?: string;
  salary: number;
  status: string;
};
export type LeaveDto = { id: string; employeeId: string; start_date: string; end_date: string; type: string; status: string };
export type PayrollDto = {
  id: string;
  employeeId: string;
  month: string;
  gross: number;
  net: number;
  deductions_json?: any;
  employee?: { emiratesId?: string | null };
};
export type ManpowerSupplierDto = {
  id: string;
  name: string;
  contactPerson: string;
  phone?: string | null;
};

export async function fetchAttendance(params: { search?: string; status?: string; project?: string; employeeId?: string; start?: string; end?: string; page: number; pageSize: number; token?: string; }) {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.status && params.status !== 'All') q.set('status', params.status);
  if (params.project && params.project !== 'All') q.set('project', params.project);
  if (params.employeeId) q.set('employeeId', params.employeeId);
  if (params.start) q.set('start', params.start);
  if (params.end) q.set('end', params.end);
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  return apiFetch<ApiResult<AttendanceDto[]>>(`/attendance?${q.toString()}`, { token: params.token, retries: 2 });
}

export async function createAttendance(body: {
  employeeId: string;
  emiratesId?: string;
  check_in?: string;
  check_out?: string;
  status?: string;
  location?: string;
  otHours?: number;
  signature?: string;
  token?: string;
}) {
  const { token, ...payload } = body as any;
  return apiFetch<any>(`/attendance`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
    retries: 1,
  } as any);
}

export async function updateAttendance(
  params: { id: string; token?: string },
  body: Partial<{ check_in: string; check_out?: string; status?: string; location?: string; approvedBy?: string; otHours?: number; signature?: string }>,
) {
  return apiFetch<any>(
    `/attendance/${params.id}`,
    { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any,
  );
}

export async function deleteAttendance(params: { id: string; token?: string }) {
  return apiFetch<any>(
    `/attendance/${params.id}`,
    { method: 'DELETE', token: params.token, retries: 1 } as any,
  );
}

export async function fetchRoster(params: { search?: string; shift?: string; page: number; pageSize: number; token?: string; }) {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.shift && params.shift !== 'All') q.set('shift', params.shift);
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  return apiFetch<ApiResult<RosterDto[]>>(`/roster?${q.toString()}`, { token: params.token, retries: 2 });
}

// Employees CRUD
export async function fetchEmployees(params: { page: number; pageSize: number; search?: string; token?: string }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.search) q.set('search', params.search);
  return apiFetch<ApiResult<EmployeeDto[]>>(`/employees?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createEmployee(body: {
  company: string;
  employeeName: string;
  dateOfJoining: string;
  emiratesId: string;
  labourCardNo?: string;
  mobileNo: string;
  bankAccountNo?: string;
  salary: number;
  status: string;
  token?: string;
}) {
  const { token, ...payload } = body as any;
  return apiFetch<EmployeeDto>(`/employees`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 } as any);
}
export async function createEmployeeWithUser(body: { email: string; name: string; password: string; roleId: string; employment_details_json?: any; token?: string }) {
  return apiFetch<{ user: any; employee: EmployeeDto }>(`/employees/with-user`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 } as any);
}
export async function updateEmployee(
  params: { id: string; token?: string },
  body: Partial<{
    dateOfJoining: string;
    employeeName: string;
    labourCardNo: string;
    mobileNo: string;
    bankAccountNo: string;
    salary: number;
    status: string;
  }>,
) {
  return apiFetch<EmployeeDto>(`/employees/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any);
}
export async function deleteEmployee(params: { id: string; token?: string }) {
  return apiFetch<any>(`/employees/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 } as any);
}

// Leaves CRUD
export async function fetchLeaves(params: { page: number; pageSize: number; status?: string; employeeId?: string; start?: string; end?: string; token?: string }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.status && params.status !== 'All') q.set('status', params.status);
  if (params.employeeId) q.set('employeeId', params.employeeId);
  if (params.start) q.set('start', params.start);
  if (params.end) q.set('end', params.end);
  return apiFetch<ApiResult<LeaveDto[]>>(`/leaves?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createLeave(body: { employeeId: string; start_date: string; end_date: string; type: string; status?: string; token?: string }) {
  return apiFetch<LeaveDto>(`/leaves`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 } as any);
}
export async function updateLeave(params: { id: string; token?: string }, body: Partial<{ start_date: string; end_date: string; type: string; status: string }>) {
  return apiFetch<LeaveDto>(`/leaves/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any);
}
export async function deleteLeave(params: { id: string; token?: string }) {
  return apiFetch<any>(`/leaves/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 } as any);
}

// Payroll CRUD
export async function fetchPayrolls(params: { page: number; pageSize: number; month?: string; employeeId?: string; token?: string }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.month) q.set('month', params.month);
  if (params.employeeId) q.set('employeeId', params.employeeId);
  return apiFetch<ApiResult<PayrollDto[]>>(`/payroll?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createPayroll(body: { employeeId: string; month: string; gross: number; net: number; deductions_json?: any; token?: string }) {
  return apiFetch<PayrollDto>(`/payroll`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 } as any);
}
export async function updatePayroll(params: { id: string; token?: string }, body: Partial<{ month: string; gross: number; net: number; deductions_json?: any }>) {
  return apiFetch<PayrollDto>(`/payroll/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any);
}
export async function deletePayroll(params: { id: string; token?: string }) {
  return apiFetch<any>(`/payroll/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 } as any);
}

// Manpower Suppliers
export async function fetchManpowerSuppliers(params: { page: number; pageSize: number; search?: string; token?: string }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.search) q.set('search', params.search);
  return apiFetch<ApiResult<ManpowerSupplierDto[]>>(`/manpower-suppliers?${q.toString()}`, { token: params.token, retries: 2 });
}

export async function createManpowerSupplier(body: { name: string; contactPerson: string; phone?: string; token?: string }) {
  const { token, ...payload } = body as any;
  return apiFetch<ManpowerSupplierDto>(`/manpower-suppliers`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 } as any);
}

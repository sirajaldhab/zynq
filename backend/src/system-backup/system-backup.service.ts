import { Injectable, Logger } from '@nestjs/common';
import AdmZip = require('adm-zip');
import { Workbook, Worksheet } from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemBackupService {
  private readonly logger = new Logger(SystemBackupService.name);
  private readonly baseDir = 'backup';

  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const record = await this.findOrCreateSettings();
    return { emails: record.emails || '' };
  }

  async updateSettings(emails: string) {
    const record = await this.findOrCreateSettings();
    const updated = await this.saveSettings(record.id, emails);
    return { emails: updated || '' };
  }

  async generateSystemBackupZip() {
    const zip = new AdmZip();
    const timestamp = this.timestamp();

    await this.addStandardWorkbooks(zip);
    await this.addFinanceCompanySalaryWorkbook(zip);
    await this.addProjectMaterialDeliveryWorkbook(zip);

    const buffer = zip.toBuffer();
    return { buffer, filename: `backup-${timestamp}.zip` };
  }

  private async addStandardWorkbooks(zip: AdmZip) {
    const jobs: Array<{ filename: string; fetcher: () => Promise<any[]> }> = [
      { filename: 'finance_invoices.xlsx', fetcher: () => this.prisma.invoice.findMany() },
      { filename: 'finance_expenses.xlsx', fetcher: () => this.prisma.expense.findMany() },
      {
        filename: 'finance_general_expenses.xlsx',
        fetcher: () => this.prisma.expense.findMany({ where: { category: 'General Expense' } }),
      },
      {
        filename: 'finance_manpower_external_labour_expense.xlsx',
        fetcher: () => this.prisma.externalLabourExpense.findMany(),
      },
      { filename: 'finance_payments.xlsx', fetcher: () => this.prisma.payment.findMany() },
      { filename: 'finance_budgets.xlsx', fetcher: () => this.prisma.budget.findMany() },
      { filename: 'finance_accounts.xlsx', fetcher: () => this.prisma.account.findMany() },
      { filename: 'finance_tax_rates.xlsx', fetcher: () => this.prisma.taxRate.findMany() },
      { filename: 'finance_ledger_entries.xlsx', fetcher: () => this.prisma.ledgerEntry.findMany() },
      { filename: 'clients.xlsx', fetcher: () => this.prisma.client.findMany() },
      { filename: 'vendors.xlsx', fetcher: () => this.prisma.vendor.findMany() },
      { filename: 'companies.xlsx', fetcher: () => this.prisma.company.findMany() },
      { filename: 'projects_list.xlsx', fetcher: () => this.prisma.project.findMany() },
      { filename: 'project_extras.xlsx', fetcher: () => this.prisma.projectExtra.findMany() },
      { filename: 'materials.xlsx', fetcher: () => this.prisma.material.findMany() },
      { filename: 'manpower_records.xlsx', fetcher: () => this.prisma.manpowerRecord.findMany() },
      { filename: 'invoice_items.xlsx', fetcher: () => this.prisma.invoiceItem.findMany() },
      { filename: 'hr_employees.xlsx', fetcher: () => this.prisma.employee.findMany() },
      { filename: 'hr_attendance.xlsx', fetcher: () => this.prisma.attendance.findMany() },
      { filename: 'hr_payroll.xlsx', fetcher: () => this.prisma.payroll.findMany() },
      { filename: 'hr_leave_requests.xlsx', fetcher: () => this.prisma.leave.findMany() },
      { filename: 'site_day_salaries.xlsx', fetcher: () => this.prisma.siteDaySalary.findMany() },
      { filename: 'document_companies.xlsx', fetcher: () => this.prisma.documentCompany.findMany() },
      { filename: 'document_files.xlsx', fetcher: () => this.prisma.companyDocument.findMany() },
      { filename: 'settings_users.xlsx', fetcher: () => this.prisma.user.findMany() },
      { filename: 'settings_roles.xlsx', fetcher: () => this.prisma.role.findMany() },
      { filename: 'settings_permissions.xlsx', fetcher: () => this.prisma.permission.findMany() },
      { filename: 'settings_audit_logs.xlsx', fetcher: () => this.prisma.auditLog.findMany() },
      { filename: 'settings_notifications.xlsx', fetcher: () => this.prisma.notification.findMany() },
      { filename: 'settings_backup_meta.xlsx', fetcher: () => this.prisma.backupMeta.findMany() },
      { filename: 'system_logs.xlsx', fetcher: () => this.prisma.systemLog.findMany() },
    ];

    for (const job of jobs) {
      await this.addWorkbookFromQuery(zip, job.filename, job.fetcher);
    }
  }

  private async addFinanceCompanySalaryWorkbook(zip: AdmZip) {
    const rows = await this.prisma.payroll.findMany();
    const filtered = rows.filter((row) => this.hasSalaryExtras(row.deductions_json));
    const buffer = await this.buildWorkbookFromRecords(filtered, 'Salary Records');
    zip.addFile(this.path('finance_company_employee_salary.xlsx'), buffer);
  }

  private hasSalaryExtras(raw: any) {
    if (!raw) return false;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return parsed && (typeof parsed.salaryPaid === 'number' || typeof parsed.loan === 'number');
    } catch (err) {
      this.logger.verbose(`Failed to parse salary extras: ${String(err)}`);
      return false;
    }
  }

  private async addProjectMaterialDeliveryWorkbook(zip: AdmZip) {
    const materials = await this.prisma.material.findMany();
    const projects = await this.prisma.project.findMany({ select: { id: true, name: true } });
    const projectNames = new Map(projects.map((p) => [p.id, p.name] as const));

    const workbook = new Workbook();
    const grouped = new Map<string, any[]>();
    for (const material of materials) {
      const key = material.projectId || 'UNASSIGNED';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(material);
    }

    if (grouped.size === 0) {
      const sheet = workbook.addWorksheet('Data');
      this.populateSheet(sheet, []);
    } else {
      const usedNames = new Set<string>();
      for (const [projectId, rows] of grouped.entries()) {
        const projectName = projectNames.get(projectId) || 'Unassigned Project';
        const sheetName = this.uniqueSheetName(this.sanitizeSheetName(projectName), usedNames);
        const sheet = workbook.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });
        this.populateSheet(sheet, rows);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const content = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    zip.addFile(this.path('project_material_delivery.xlsx'), content);
  }

  private async addWorkbookFromQuery(zip: AdmZip, filename: string, fetcher: () => Promise<any[]>) {
    const rows = await fetcher();
    const buffer = await this.buildWorkbookFromRecords(rows);
    zip.addFile(this.path(filename), buffer);
  }

  private async buildWorkbookFromRecords(records: any[], sheetName = 'Data') {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });
    this.populateSheet(sheet, records);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }

  private populateSheet(sheet: Worksheet, records: any[]) {
    const normalized = this.normalizeRecords(records);
    if (normalized.length === 0) {
      const row = sheet.addRow(['No records found']);
      row.font = { italic: true };
      return;
    }
    const headers = this.collectHeaders(normalized);
    const headerRow = sheet.addRow(headers.map((key) => this.humanize(key)));
    headerRow.font = { bold: true };
    normalized.forEach((record) => {
      sheet.addRow(headers.map((key) => record[key] ?? ''));
    });
    this.autofitColumns(sheet, headers, normalized);
  }

  private normalizeRecords(records: any[]) {
    return records.map((record) => {
      const plain = JSON.parse(JSON.stringify(record));
      const normalized: Record<string, any> = {};
      Object.entries(plain).forEach(([key, value]) => {
        normalized[key] = this.normalizeValue(value);
      });
      return normalized;
    });
  }

  private normalizeValue(value: any) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
  }

  private collectHeaders(records: Array<Record<string, any>>) {
    const headers = new Set<string>();
    records.forEach((record) => {
      Object.keys(record).forEach((key) => headers.add(key));
    });
    return Array.from(headers);
  }

  private autofitColumns(sheet: Worksheet, headers: string[], rows: Array<Record<string, any>>) {
    headers.forEach((key, index) => {
      const headerText = this.humanize(key);
      const maxLength = rows.reduce((length, row) => {
        const cell = row[key];
        return Math.max(length, String(cell ?? '').length);
      }, headerText.length);
      sheet.getColumn(index + 1).width = Math.min(60, Math.max(12, maxLength + 2));
    });
  }

  private humanize(key: string) {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private sanitizeSheetName(name: string) {
    const cleaned = name.replace(/[\\/*?:\[\]]/g, '').trim() || 'Sheet';
    return cleaned.slice(0, 31);
  }

  private uniqueSheetName(base: string, used: Set<string>) {
    let candidate = base;
    let counter = 1;
    while (used.has(candidate)) {
      counter += 1;
      const suffix = ` (${counter})`;
      candidate = `${base.slice(0, Math.max(0, 31 - suffix.length))}${suffix}`;
    }
    used.add(candidate);
    return candidate;
  }

  private path(filename: string) {
    return `${this.baseDir}/${filename}`;
  }

  private timestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  private async findOrCreateSettings(): Promise<{ id: string; emails: string | null }> {
    try {
      let record = await (this.prisma as any).backupSetting?.findUnique({ where: { id: 'backup-settings' } });
      if (record) return record;
      if ((this.prisma as any).backupSetting) {
        record = await (this.prisma as any).backupSetting.create({ data: { id: 'backup-settings', emails: null } });
        return record;
      }
    } catch (err) {
      this.logger.warn(`BackupSetting model missing, falling back to company settings. ${String(err)}`);
    }

    const company = await this.ensureCompany();
    const meta = company.settingsJson ? JSON.parse(company.settingsJson) : {};
    return { id: company.id, emails: meta.__backupEmails || null };
  }

  private async saveSettings(id: string, emails: string) {
    try {
      if ((this.prisma as any).backupSetting) {
        const updated = await (this.prisma as any).backupSetting.update({
          where: { id: 'backup-settings' },
          data: { emails: emails || null },
        });
        return updated.emails;
      }
    } catch (err) {
      this.logger.warn(`Failed to persist backup setting via dedicated model. ${String(err)}`);
    }

    const company = await this.ensureCompany();
    const meta = company.settingsJson ? JSON.parse(company.settingsJson) : {};
    meta.__backupEmails = emails || undefined;
    await this.prisma.company.update({ where: { id: company.id }, data: { settingsJson: JSON.stringify(meta) } });
    return meta.__backupEmails || '';
  }

  private async ensureCompany() {
    let company = await this.prisma.company.findFirst();
    if (!company) {
      company = await this.prisma.company.create({ data: { name: 'Default', settingsJson: '{}' } });
    }
    return company;
  }
}

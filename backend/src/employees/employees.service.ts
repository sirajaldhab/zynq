import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import * as argon2 from 'argon2';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  async list(params: { page?: number; pageSize?: number; search?: string }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));

    const where: any = {};
    if (params.search) {
      const s = params.search.trim();
      if (s) {
        where.OR = [
          { employeeName: { contains: s } },
          { company: { contains: s } },
          { emiratesId: { contains: s } },
        ];
      }
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        include: { user: true },
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { data, total, page, pageSize };
  }

  async get(id: string, user?: { id?: string; name?: string; email?: string }) {
    const e = await this.prisma.employee.findUnique({ where: { id }, include: { user: true } });
    if (!e) throw new NotFoundException('Employee not found');
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'viewed',
        entityType: 'Employee',
        entityId: e.id,
        entityName: e.employeeName,
      })
      .catch(() => {});
    return e;
  }

  async create(
    body: {
      company: string;
      employeeName: string;
      dateOfJoining: string;
      emiratesId: string;
      labourCardNo?: string;
      mobileNo: string;
      bankAccountNo?: string;
      salary: number;
      status: string;
      userId?: string | null;
      employment_details_json?: any;
    },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const data: any = {
      company: body.company,
      employeeName: body.employeeName,
      dateOfJoining: new Date(body.dateOfJoining),
      emiratesId: body.emiratesId,
      mobileNo: body.mobileNo,
      salary: body.salary,
      status: body.status,
    };
    if (body.labourCardNo) data.labourCardNo = body.labourCardNo;
    if (body.bankAccountNo) data.bankAccountNo = body.bankAccountNo;
    if (body.userId) data.userId = body.userId;
    if (body.employment_details_json !== undefined) {
      data.employment_details_json =
        typeof body.employment_details_json === 'string'
          ? body.employment_details_json
          : JSON.stringify(body.employment_details_json);
    }
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.employee.findFirst({ where: { emiratesId: body.emiratesId } });
      if (existing) {
        throw new BadRequestException('This employee is already registered.');
      }
      const created = await tx.employee.create({ data });
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'created',
          entityType: 'Employee',
          entityId: created.id,
          entityName: created.employeeName,
          extra: {
            company: created.company,
            status: created.status,
            salary: created.salary,
          },
        })
        .catch(() => {});
      return created;
    });
  }

  update(
    id: string,
    body: Partial<{
      dateOfJoining: string;
      employeeName: string;
      labourCardNo: string;
      mobileNo: string;
      bankAccountNo: string;
      salary: number;
      status: string;
    }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    const data: any = {};
    if (body.dateOfJoining) data.dateOfJoining = new Date(body.dateOfJoining);
    if (body.employeeName !== undefined) data.employeeName = body.employeeName;
    if (body.labourCardNo !== undefined) data.labourCardNo = body.labourCardNo;
    if (body.mobileNo !== undefined) data.mobileNo = body.mobileNo;
    if (body.bankAccountNo !== undefined) data.bankAccountNo = body.bankAccountNo;
    if (body.salary !== undefined) data.salary = body.salary;
    if (body.status !== undefined) data.status = body.status;
    return this.prisma.employee.update({ where: { id }, data }).then((updated) => {
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'updated',
          entityType: 'Employee',
          entityId: updated.id,
          entityName: updated.employeeName,
          extra: {
            company: updated.company,
            status: updated.status,
            salary: updated.salary,
          },
        })
        .catch(() => {});
      return updated;
    });
  }

  delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    return this.prisma.employee.delete({ where: { id } }).then((deleted) => {
      this.systemLogs
        .logActivity({
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          action: 'deleted',
          entityType: 'Employee',
          entityId: deleted.id,
          entityName: deleted.employeeName,
          extra: {
            company: deleted.company,
            status: deleted.status,
          },
        })
        .catch(() => {});
      return deleted;
    });
  }

  async createWithUser(
    body: {
      email: string;
      name: string;
      password: string;
      roleId: string;
      employment_details_json?: any;
    },
    user?: { id?: string; name?: string; email?: string },
  ) {
    const { email, name, password, roleId, employment_details_json } = body;
    const passwordHash = await argon2.hash(password);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name, passwordHash, roleId, status: 'ACTIVE' },
      });

      const empData: any = { userId: user.id };
      if (employment_details_json) {
        empData.employment_details_json =
          typeof employment_details_json === 'string'
            ? employment_details_json
            : JSON.stringify(employment_details_json);
      }
      const employee = await tx.employee.create({ data: empData });
      return { user, employee };
    });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'EmployeeWithUser',
        entityId: result.employee.id,
        entityName: result.user.name,
        extra: {
          userEmail: result.user.email,
          roleId: result.user.roleId,
        },
      })
      .catch(() => {});

    return result;
  }
}

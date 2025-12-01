import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import * as path from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class DocumentCompaniesService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  private readonly uploadRoot = path.join(process.cwd(), 'uploads', 'company-documents');

  private readonly allowedTypes = [
    'company-profile',
    'trade-license',
    'vat-certificate',
    'corporate-tax-certificate',
    'establishment-card',
  ] as const;

  private ensureValidType(type: string) {
    if ((this.allowedTypes as readonly string[]).includes(type)) return type as (typeof this.allowedTypes)[number];
    throw new Error('Invalid document type');
  }

  private getStoragePath(companyId: string, type: string) {
    const safeType = type.toLowerCase();
    return path.join(this.uploadRoot, companyId, `${safeType}.pdf`);
  }

  async list(params: { page?: number; pageSize?: number }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 20));

    const [total, data] = await this.prisma.$transaction([
      this.prisma.documentCompany.count(),
      this.prisma.documentCompany.findMany({
        include: { createdBy: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: data.map((c: any) => ({
        id: c.id,
        name: c.name,
        createdById: c.createdById,
        createdByName: c.createdBy?.name || null,
        createdAt: c.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async create(body: { name: string; createdById: string }, user?: { id?: string; name?: string; email?: string }) {
    const name = body.name.trim();
    if (!name) throw new Error('Name is required');
    const created = await this.prisma.documentCompany.create({
      data: { name, createdById: body.createdById },
      include: { createdBy: true },
    });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'DocumentCompany',
        entityId: created.id,
        entityName: created.name,
        extra: {
          createdById: created.createdById,
          createdByName: created.createdBy?.name,
        },
      })
      .catch(() => {});

    return {
      id: created.id,
      name: created.name,
      createdById: created.createdById,
      createdByName: created.createdBy?.name || null,
      createdAt: created.createdAt,
    };
  }

  async update(id: string, body: { name: string }, user?: { id?: string; name?: string; email?: string }) {
    const existing = await this.prisma.documentCompany.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Company not found');
    const updated = await this.prisma.documentCompany.update({
      where: { id },
      data: { name: body.name.trim() },
      include: { createdBy: true },
    });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'updated',
        entityType: 'DocumentCompany',
        entityId: updated.id,
        entityName: updated.name,
        extra: {
          createdById: updated.createdById,
          createdByName: updated.createdBy?.name,
        },
      })
      .catch(() => {});
    return {
      id: updated.id,
      name: updated.name,
      createdById: updated.createdById,
      createdByName: updated.createdBy?.name || null,
      createdAt: updated.createdAt,
    };
  }

  async delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    const existing = await this.prisma.documentCompany.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Company not found');
    await this.prisma.documentCompany.delete({ where: { id } });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'deleted',
        entityType: 'DocumentCompany',
        entityId: existing.id,
        entityName: existing.name,
      })
      .catch(() => {});
    return { success: true };
  }

  async uploadDocument(companyId: string, type: string, file: any, user?: { id?: string; name?: string; email?: string }) {
    this.ensureValidType(type);
    const company = await this.prisma.documentCompany.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const destPath = this.getStoragePath(companyId, type);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, file.buffer);

    const doc = await this.prisma.companyDocument.upsert({
      where: { companyId_type: { companyId, type } },
      update: { fileName: file.originalname, storagePath: destPath, uploadedAt: new Date() },
      create: { companyId, type, fileName: file.originalname, storagePath: destPath },
    });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'uploaded',
        entityType: 'CompanyDocument',
        entityId: `${doc.companyId}:${doc.type}`,
        entityName: company.name,
        extra: {
          documentType: doc.type,
          fileName: doc.fileName,
        },
      })
      .catch(() => {});

    return { type: doc.type, fileName: doc.fileName };
  }

  async listDocuments(companyId: string) {
    const docs = await this.prisma.companyDocument.findMany({ where: { companyId } });
    return docs.map((d) => ({ type: d.type, fileName: d.fileName }));
  }

  async getDocumentFile(companyId: string, type: string) {
    this.ensureValidType(type);
    const doc = await this.prisma.companyDocument.findUnique({
      where: { companyId_type: { companyId, type } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    await fs.access(doc.storagePath);
    return { fileName: doc.fileName, path: doc.storagePath };
  }

  async deleteDocument(companyId: string, type: string, user?: { id?: string; name?: string; email?: string }) {
    this.ensureValidType(type);
    const doc = await this.prisma.companyDocument.findUnique({
      where: { companyId_type: { companyId, type } },
    });
    if (!doc) return { success: true };
    const company = await this.prisma.documentCompany.findUnique({ where: { id: companyId } });
    try {
      await fs.unlink(doc.storagePath);
    } catch {
      // ignore missing file
    }
    await this.prisma.companyDocument.delete({
      where: { companyId_type: { companyId, type } },
    });
    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'deleted',
        entityType: 'CompanyDocument',
        entityId: `${companyId}:${type}`,
        entityName: company?.name,
        extra: {
          documentType: type,
          fileName: doc.fileName,
        },
      })
      .catch(() => {});
    return { success: true };
  }
}

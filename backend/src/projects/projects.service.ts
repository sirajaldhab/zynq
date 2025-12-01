import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService,
  ) {}

  async list(params: { companyId?: string; page?: number; pageSize?: number; search?: string; contractor?: string; manager?: string; client?: string; site?: string; type?: 'MAIN' | 'SUB' }) {
    const { companyId, page, pageSize, search, contractor, manager, client, site, type } = params;
    const and: any[] = [];
    if (companyId) {
      // companyId coming from UI is a DocumentCompany.id; resolve it to a Company via name
      const docCompany = await this.prisma.documentCompany.findUnique({ where: { id: companyId } });
      if (docCompany) {
        const byName = await this.prisma.company.findUnique({ where: { name: docCompany.name } });
        if (byName) {
          and.push({ companyId: byName.id });
        } else {
          // If no Company yet, create one lazily and filter by it
          const created = await this.prisma.company.create({
            data: { name: docCompany.name, settingsJson: '{}' },
          });
          and.push({ companyId: created.id });
        }
      }
    }
    if (search)
      and.push({
        OR: [
          { name: { contains: search } },
          { site: { contains: search } },
          { main_contractor: { contains: search } },
          { consultant: { contains: search } },
        ],
      });
    if (contractor) and.push({ main_contractor: { contains: contractor } });
    if (manager) and.push({ project_manager_id: { contains: manager } });
    if (client)
      and.push({
        OR: [
          { client: { name: { contains: client } } },
          { clientId: { contains: client } },
        ],
      });
    if (site) and.push({ site: { contains: site } });
    if (type === 'MAIN') and.push({ parentId: null });
    if (type === 'SUB') and.push({ NOT: { parentId: null } });
    const where: any = and.length ? { AND: and } : {};
    const take = pageSize && pageSize > 0 ? pageSize : undefined;
    const skip = take && page && page > 0 ? (page - 1) * take : undefined;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take,
        include: ({ client: true, company: true } as any),
      }),
      this.prisma.project.count({ where }),
    ]);
    return { data, total };
  }

  async get(id: string) {
    const p = await this.prisma.project.findUnique({
      where: { id },
      include: ({ client: true, company: true } as any),
    });
    if (!p) throw new NotFoundException('Project not found');
    return p;
  }

  async create(data: any, user?: { id?: string; name?: string; email?: string }) {
    // Resolve companyId. When coming from Documents > Company List, data.companyId is a DocumentCompany.id.
    let companyId: string | undefined;

    if (data.companyId) {
      // Try to interpret as a DocumentCompany id first
      const docCompany = await this.prisma.documentCompany.findUnique({ where: { id: data.companyId } });
      if (docCompany) {
        // Map by name to a Company row; create one if it doesn't exist yet
        const existingByName = await this.prisma.company.findUnique({ where: { name: docCompany.name } });
        if (existingByName) {
          companyId = existingByName.id;
        } else {
          const created = await this.prisma.company.create({
            data: { name: docCompany.name, settingsJson: '{}' },
          });
          companyId = created.id;
        }
      } else {
        // Fallback: treat incoming id as a Company id from legacy callers
        const existingById = await this.prisma.company.findUnique({ where: { id: data.companyId } });
        if (existingById) {
          companyId = existingById.id;
        } else {
          // As an ultimate fallback, reuse or create a single default company
          let anyCompany = await this.prisma.company.findFirst();
          if (!anyCompany) {
            anyCompany = await this.prisma.company.create({
              data: { name: 'Default Company', settingsJson: '{}' },
            });
          }
          companyId = anyCompany.id;
        }
      }
    } else {
      // No company provided: reuse or create a single default company
      let baseCompany = await this.prisma.company.findFirst();
      if (!baseCompany) {
        baseCompany = await this.prisma.company.create({
          data: { name: 'Default Company', settingsJson: '{}' },
        });
      }
      companyId = baseCompany.id;
    }

    // Resolve client by id or name (clientName). If clientId is provided but not found, treat it as a name.
    let clientId: string | null = data.clientId ?? null;
    const inputClientName: string | undefined = data.clientName;
    if (clientId) {
      const existingById = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!existingById) {
        // Interpret provided clientId string as a name
        const byName = await this.prisma.client.findFirst({ where: { name: clientId } });
        if (byName) clientId = byName.id;
        else clientId = (await this.prisma.client.create({ data: { name: clientId } })).id;
      }
    } else if (inputClientName) {
      const existingByName = await this.prisma.client.findFirst({ where: { name: inputClientName } });
      if (existingByName) clientId = existingByName.id;
      else clientId = (await this.prisma.client.create({ data: { name: inputClientName } })).id;
    }

    const payload: any = {
      name: data.name,
      companyId,
      main_contractor: data.main_contractor ?? null,
      consultant: data.consultant ?? null,
      project_manager_id: data.project_manager_id ?? null,
      plots_json: data.plots_json ?? null,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      status: data.status ?? undefined,
      parentId: data.parentId ?? null,
      clientId: clientId,
      site: data.site ?? null,
    };
    const created = await this.prisma.project.create({
      data: payload,
      include: {
        client: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'created',
        entityType: 'Project',
        entityId: created.id,
        entityName: created.name,
        extra: {
          companyId: created.companyId,
          companyName: created.company?.name,
          clientId: created.clientId,
          clientName: created.client?.name,
          site: created.site,
          status: created.status,
        },
      })
      .catch(() => {});

    return created;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      main_contractor?: string | null;
      consultant?: string | null;
      project_manager_id?: string | null;
      plots_json?: any;
      start_date?: Date | null;
      end_date?: Date | null;
      status?: string;
      parentId?: string | null;
      clientId?: string | null;
      clientName?: string | null;
      companyId?: string | null;
      site?: string | null;
    }>,
    user?: { id?: string; name?: string; email?: string },
  ) {
    const payload: any = { ...data };

    // Resolve companyId in the same way as create(): prefer mapping from DocumentCompany by name
    if (data.companyId !== undefined) {
      let resolvedCompanyId: string | undefined;
      const incomingCompanyId = data.companyId || undefined;

      if (incomingCompanyId) {
        const docCompany = await this.prisma.documentCompany.findUnique({ where: { id: incomingCompanyId } });
        if (docCompany) {
          const existingByName = await this.prisma.company.findUnique({ where: { name: docCompany.name } });
          if (existingByName) {
            resolvedCompanyId = existingByName.id;
          } else {
            const created = await this.prisma.company.create({
              data: { name: docCompany.name, settingsJson: '{}' },
            });
            resolvedCompanyId = created.id;
          }
        } else {
          const existingById = await this.prisma.company.findUnique({ where: { id: incomingCompanyId } });
          if (existingById) {
            resolvedCompanyId = existingById.id;
          } else {
            let anyCompany = await this.prisma.company.findFirst();
            if (!anyCompany) {
              anyCompany = await this.prisma.company.create({
                data: { name: 'Default Company', settingsJson: '{}' },
              });
            }
            resolvedCompanyId = anyCompany.id;
          }
        }
      }

      if (resolvedCompanyId) {
        payload.companyId = resolvedCompanyId;
      }
    }

    // Resolve client similar to create(): treat unknown clientId as name, or use clientName
    if (data.clientId !== undefined || (data as any).clientName !== undefined) {
      let clientId: string | null = data.clientId ?? null;
      const inputClientName: string | undefined = (data as any).clientName ?? (clientId as any);

      if (clientId) {
        const existingById = await this.prisma.client.findUnique({ where: { id: clientId } });
        if (!existingById) {
          const byName = await this.prisma.client.findFirst({ where: { name: clientId } });
          if (byName) clientId = byName.id;
          else clientId = (await this.prisma.client.create({ data: { name: clientId } })).id;
        }
      } else if (inputClientName) {
        const existingByName = await this.prisma.client.findFirst({ where: { name: inputClientName } });
        if (existingByName) clientId = existingByName.id;
        else clientId = (await this.prisma.client.create({ data: { name: inputClientName } })).id;
      }

      payload.clientId = clientId;
      delete payload.clientName;
    }
    const updated = await this.prisma.project.update({
      where: { id },
      data: payload,
      include: {
        client: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'updated',
        entityType: 'Project',
        entityId: updated.id,
        entityName: updated.name,
        extra: {
          companyId: updated.companyId,
          companyName: updated.company?.name,
          clientId: updated.clientId,
          clientName: updated.client?.name,
          site: updated.site,
          status: updated.status,
        },
      })
      .catch(() => {});

    return updated;
  }

  async delete(id: string, user?: { id?: string; name?: string; email?: string }) {
    const deleted = await this.prisma.project.delete({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    this.systemLogs
      .logActivity({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        action: 'deleted',
        entityType: 'Project',
        entityId: deleted.id,
        entityName: deleted.name,
        extra: {
          companyId: deleted.companyId,
          companyName: deleted.company?.name,
          clientId: deleted.clientId,
          clientName: deleted.client?.name,
          site: deleted.site,
          status: deleted.status,
        },
      })
      .catch(() => {});

    return deleted;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private async getCompany() {
    let c = await this.prisma.company.findFirst();
    if (!c) {
      c = await this.prisma.company.create({ data: { name: 'Default', settingsJson: '{}' } });
    }
    return c;
  }

  async list() {
    const c = await this.getCompany();
    const obj = c.settingsJson ? JSON.parse(c.settingsJson) : {};
    return Object.keys(obj).map((k) => ({ key: k, value: String(obj[k]) }));
  }

  async update(key: string, value: string) {
    const c = await this.getCompany();
    const obj = c.settingsJson ? JSON.parse(c.settingsJson) : {};
    obj[key] = value;
    const updated = await this.prisma.company.update({ where: { id: c.id }, data: { settingsJson: JSON.stringify(obj) } });
    return { key, value: String(obj[key]) };
  }
}

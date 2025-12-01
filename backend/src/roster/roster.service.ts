import { Injectable } from '@nestjs/common';

@Injectable()
export class RosterService {
  async list(params: { page?: number; pageSize?: number; search?: string; shift?: string }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));

    // Minimal implementation: no persistence yet, just return an empty list
    return {
      data: [],
      total: 0,
      page,
      pageSize,
    };
  }
}

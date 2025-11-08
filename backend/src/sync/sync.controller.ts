import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

@Controller('sync')
export class SyncController {
  @Post('pull')
  @HttpCode(HttpStatus.OK)
  async pull(@Body() body: { checkpoint?: string; limit?: number }) {
    const limit = Math.min(Math.max(body.limit ?? 100, 1), 1000);
    return {
      checkpoint: body.checkpoint || null,
      docs: [],
      limit,
    };
  }

  @Post('push')
  @HttpCode(HttpStatus.OK)
  async push(
    @Body()
    body: {
      checkpoint?: string;
      docs: Array<{ id: string; type: string; data: any; rev?: string; updatedAt?: string }>;
    },
  ) {
    return {
      accepted: body.docs?.length ?? 0,
      conflicts: [],
      checkpoint: body.checkpoint || null,
    };
  }
}

import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { DocumentCompaniesService } from './document-companies.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
@Controller('document-companies')
export class DocumentCompaniesController {
  constructor(private readonly companies: DocumentCompaniesService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.companies.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post()
  create(
    @Req() req: any,
    @Body() body: { name: string },
  ) {
    const userId = req.user?.userId as string;
    return this.companies.create({ name: body.name, createdById: userId }, {
      id: req.user?.id || userId,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name: string },
    @Req() req: any,
  ) {
    return this.companies.update(id, body, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.companies.delete(id, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Get(':id/documents')
  listDocuments(@Param('id') id: string) {
    return this.companies.listDocuments(id);
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('id') id: string,
    @Body('type') type: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new Error('File is required');
    }
    return this.companies.uploadDocument(id, type, file, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }

  @Get(':id/documents/:type')
  async downloadDocument(
    @Param('id') id: string,
    @Param('type') type: string,
    @Res() res: Response,
  ) {
    const file = await this.companies.getDocumentFile(id, type);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    const fs = await import('fs');
    fs.createReadStream(file.path).pipe(res);
  }

  @Delete(':id/documents/:type')
  deleteDocument(@Param('id') id: string, @Param('type') type: string, @Req() req: any) {
    return this.companies.deleteDocument(id, type, {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email,
    });
  }
}

import { Controller, Post, Get, Body, Param, UseGuards, UseInterceptors, UploadedFiles, Res, StreamableFile, Req } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream } from 'fs';
import type { Response } from 'express';

// Configure multer storage
const storage = diskStorage({
  destination: './uploads/kyc',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
  },
});



@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'ghanaCardFront', maxCount: 1 },
        { name: 'ghanaCardBack', maxCount: 1 },
      ],
      { storage }
    )
  )
  async create(
    @Req() req: any,
    @Body() body: any,
    @UploadedFiles() files: { ghanaCardFront?: Express.Multer.File[], ghanaCardBack?: Express.Multer.File[] }
  ) {
    const data = { ...body };
    if (files?.ghanaCardFront?.length) {
      data.ghanaCardFront = files.ghanaCardFront[0].path;
    }
    if (files?.ghanaCardBack?.length) {
      data.ghanaCardBack = files.ghanaCardBack[0].path;
    }
    return this.customersService.create(req.user.id, data);
  }

  @Get()
  async findAll(@Req() req: any) {
    if (req.user.role === 'ADMIN') {
        return this.customersService.findAll();
    }
    return this.customersService.findAllByOfficer(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get('kyc/view/:filename')
  async serveKycFile(@Param('filename') filename: string, @Res({ passthrough: true }) res: Response) {
    const filePath = join(process.cwd(), 'uploads/kyc', filename);
    const file = createReadStream(filePath);
    
    // Basic content type detection
    const ext = extname(filename).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : 'image/jpeg';
    
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
    });
    
    return new StreamableFile(file);
  }
}

import { Module } from '@nestjs/common';
import { SusuService } from './susu.service';
import { SusuController } from './susu.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SusuController],
  providers: [SusuService],
})
export class SusuModule {}

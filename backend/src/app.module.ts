import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomersModule } from './customers/customers.module';
import { LoansModule } from './loans/loans.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SusuModule } from './susu/susu.module';

@Module({
  imports: [PrismaModule, AuthModule, CustomersModule, LoansModule, DashboardModule, NotificationsModule, SusuModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { } 

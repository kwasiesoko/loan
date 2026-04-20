import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  // Run every day at 9 AM
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleCron() {
    this.logger.debug('Running overdue reminders cron job');
    
    const overdueInstallments = await this.prisma.installment.findMany({
      where: { 
        paid: false, 
        dueDate: { lt: new Date() } 
      },
      include: { 
        loan: { 
          include: { customer: true } 
        } 
      }
    });

    for (const installment of overdueInstallments) {
      // Simulate sending WhatsApp/SMS Reminders
      this.logger.log(`[SIMULATION] Sending Reminders to ${installment.loan.customer.firstName} for missed payment of GHS ${installment.amount}`);
      
      await this.prisma.notification.create({
          data: {
              customerId: installment.loan.customerId,
              type: 'WHATSAPP',
              message: `Reminder: You have an overdue installment of GHS ${installment.amount}. Please make payment promptly to avoid penalties.`,
              status: 'SENT'
          }
      });
    }
  }
}

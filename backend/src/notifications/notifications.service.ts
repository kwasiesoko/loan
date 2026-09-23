import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  // Run every day at 9 AM to notify customers with overdue loan installments
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleCron() {
    await this.sendDailyOverdueReminders();
  }

  async sendDailyOverdueReminders() {
    this.logger.log('Running daily overdue loan SMS reminders check...');
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overdueInstallments = await this.prisma.installment.findMany({
      where: {
        paid: false,
        isDeleted: false,
        dueDate: { lt: todayStart },
        loan: {
          isDeleted: false,
          status: { in: ['ACTIVE', 'DEFAULTED'] },
        },
      },
      include: {
        loan: {
          include: { customer: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    if (overdueInstallments.length === 0) {
      this.logger.log('No overdue loan installments found today.');
      return { sent: 0, skipped: 0 };
    }

    // Group overdue installments by customer to send a single consolidated SMS per borrower
    const customerGroups = new Map<string, {
      customer: any;
      totalOverdueAmount: number;
      maxDaysOverdue: number;
    }>();

    for (const inst of overdueInstallments) {
      const customer = inst.loan.customer;
      if (!customer || !customer.phone) continue;

      const diffMs = todayStart.getTime() - inst.dueDate.getTime();
      const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      if (!customerGroups.has(customer.id)) {
        customerGroups.set(customer.id, {
          customer,
          totalOverdueAmount: inst.amount,
          maxDaysOverdue: daysOverdue,
        });
      } else {
        const group = customerGroups.get(customer.id)!;
        group.totalOverdueAmount += inst.amount;
        group.maxDaysOverdue = Math.max(group.maxDaysOverdue, daysOverdue);
      }
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const [customerId, group] of customerGroups.entries()) {
      try {
        // Prevent sending duplicate overdue SMS on the same day if re-triggered
        const alreadySentToday = await this.prisma.notification.findFirst({
          where: {
            customerId,
            type: 'SMS',
            sentAt: { gte: todayStart },
            message: { contains: 'overdue' },
          },
        });

        if (alreadySentToday) {
          this.logger.debug(`Overdue SMS already sent today to ${group.customer.firstName} (${group.customer.phone})`);
          skippedCount++;
          continue;
        }

        const message = `Dear ${group.customer.firstName}, this is a reminder that your loan payment of GHS ${group.totalOverdueAmount.toFixed(2)} is overdue by ${group.maxDaysOverdue} day(s). Kindly make payment promptly to avoid additional penalties. REAL AND FAST POINT ENT.`;

        await this.smsService.sendSms(group.customer.phone, message);

        await this.prisma.notification.create({
          data: {
            customerId,
            type: 'SMS',
            message,
            status: 'SENT',
          },
        });

        this.logger.log(`Overdue SMS sent to ${group.customer.firstName} (${group.customer.phone}) for GHS ${group.totalOverdueAmount.toFixed(2)} (${group.maxDaysOverdue} days overdue)`);
        sentCount++;
      } catch (err) {
        this.logger.error(`Failed to send overdue SMS to customer ${customerId}: ${err.message}`);
      }
    }

    this.logger.log(`Daily overdue SMS run completed. Sent: ${sentCount}, Skipped: ${skippedCount}`);
    return { sent: sentCount, skipped: skippedCount };
  }
}

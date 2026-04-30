import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class SusuService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService
  ) {}

  async createContribution(officerId: string, data: any) {
    const { customerId, amount, note } = data;
    const contribution = await this.prisma.susuContribution.create({
      data: {
        customerId,
        officerId,
        amount,
        note,
      },
      include: { customer: true }
    });

    // Optional: SMS for contribution as well? User didn't explicitly ask for it but it's good practice.
    // I'll skip it for now to follow strictly.

    return contribution;
  }

  async createWithdrawal(officerId: string, data: any) {
    const { customerId, amount, note } = data;
    
    // Check balance
    const balance = await this.getCustomerBalance(customerId);
    if (balance < amount) {
      throw new Error(`Insufficient Susu balance. Current balance: GHS ${balance}`);
    }

    const withdrawal = await this.prisma.susuWithdrawal.create({
      data: {
        customerId,
        officerId,
        amount,
        status: 'APPROVED',
        note,
      },
      include: { customer: true }
    });

    const newBalance = balance - amount;

    // Send SMS Alert
    try {
      const message = `Susu Withdrawal Alert: GHS ${amount} has been withdrawn from your savings. New balance: GHS ${newBalance.toFixed(2)}. Thank you.`;
      await this.smsService.sendSms(withdrawal.customer.phone, message);
      
      await this.prisma.notification.create({
        data: {
          customerId: withdrawal.customerId,
          type: 'SMS',
          message: message,
          status: 'SENT'
        }
      });
    } catch (e) {
      console.error('Failed to send withdrawal SMS:', e.message);
    }

    return withdrawal;
  }

  async getCustomerBalance(customerId: string) {
    const contributions = await this.prisma.susuContribution.aggregate({
      where: { customerId },
      _sum: { amount: true },
    });
    const withdrawals = await this.prisma.susuWithdrawal.aggregate({
      where: { customerId, status: 'APPROVED' },
      _sum: { amount: true },
    });

    return (contributions._sum.amount || 0) - (withdrawals._sum.amount || 0);
  }

  async getWithdrawals() {
    return this.prisma.susuWithdrawal.findMany({
      include: {
        customer: true,
        officer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { withdrawnAt: 'desc' },
    });
  }

  async getWithdrawalsByOfficer(officerId: string) {
    return this.prisma.susuWithdrawal.findMany({
      where: { officerId },
      include: {
        customer: true,
        officer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { withdrawnAt: 'desc' },
    });
  }

  async getContributions() {
    return this.prisma.susuContribution.findMany({
      include: {
        customer: true,
        officer: {
            select: {
                id: true,
                name: true,
                email: true
            }
        },
      },
      orderBy: {
        collectedAt: 'desc',
      },
    });
  }

  async getContributionsByOfficer(officerId: string) {
    return this.prisma.susuContribution.findMany({
      where: { officerId },
      include: {
        customer: true,
        officer: {
            select: {
                id: true,
                name: true,
                email: true
            }
        },
      },
      orderBy: {
        collectedAt: 'desc',
      },
    });
  }

  async getCustomerContributions(customerId: string) {
    return this.prisma.susuContribution.findMany({
      where: { customerId },
      include: {
        officer: {
            select: {
                id: true,
                name: true,
                email: true
            }
        }
      },
      orderBy: {
        collectedAt: 'desc',
      },
    });
  }
}

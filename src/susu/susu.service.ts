import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SusuService {
  constructor(private prisma: PrismaService) {}

  async createContribution(officerId: string, data: any) {
    const { customerId, amount, note } = data;
    return this.prisma.susuContribution.create({
      data: {
        customerId,
        officerId,
        amount,
        note,
      },
    });
  }

  async createWithdrawal(officerId: string, data: any) {
    const { customerId, amount, note } = data;
    
    // Check balance
    const balance = await this.getCustomerBalance(customerId);
    if (balance < amount) {
      throw new Error(`Insufficient Susu balance. Current balance: GHS ${balance}`);
    }

    return this.prisma.susuWithdrawal.create({
      data: {
        customerId,
        officerId,
        amount,
        status: 'APPROVED', // Auto-approve for now or could be PENDING
        note,
      },
    });
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

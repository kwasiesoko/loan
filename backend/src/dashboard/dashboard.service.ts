import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminDashboardMetrics() {
    const totalLoans = await this.prisma.loan.count();
    const totalAmountAgg = await this.prisma.loan.aggregate({
      _sum: { amount: true, totalRepayable: true }
    });
    
    const repaymentsAgg = await this.prisma.repayment.aggregate({
      _sum: { amount: true }
    });

    const activeLoans = await this.prisma.loan.count({ where: { status: 'ACTIVE' } });
    const defaultedLoans = await this.prisma.loan.count({ where: { status: 'DEFAULTED' } });
    const completedLoans = await this.prisma.loan.count({ where: { status: 'COMPLETED' } });

    const parStats = await this.calculatePARStats();
    const collectionEfficiency = await this.calculateCollectionEfficiency();
    const trends = await this.getMonthlyTrends();
    const customerStats = await this.getCustomerStats();

    const susuAgg = await this.prisma.susuContribution.aggregate({
      _sum: { amount: true }
    });
    const susuWithAgg = await this.prisma.susuWithdrawal.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySusuAgg = await this.prisma.susuContribution.aggregate({
      where: { collectedAt: { gte: todayStart } },
      _sum: { amount: true }
    });
    const todaySusuWithAgg = await this.prisma.susuWithdrawal.aggregate({
      where: { status: 'APPROVED', withdrawnAt: { gte: todayStart } },
      _sum: { amount: true }
    });

    return {
      totalLoans,
      activeLoans,
      defaultedLoans,
      completedLoans,
      totalDisbursed: totalAmountAgg._sum.amount || 0,
      totalExpectedReturn: totalAmountAgg._sum.totalRepayable || 0,
      totalCollected: repaymentsAgg._sum.amount || 0,
      outstandingBalance: (totalAmountAgg._sum.totalRepayable || 0) - (repaymentsAgg._sum.amount || 0),
      customerStats,
      parStats,
      collectionEfficiency,
      totalSusu: (susuAgg._sum.amount || 0) - (susuWithAgg._sum.amount || 0),
      totalSusuDeposits: susuAgg._sum.amount || 0,
      totalSusuWithdrawals: susuWithAgg._sum.amount || 0,
      todaySusu: (todaySusuAgg._sum.amount || 0) - (todaySusuWithAgg._sum.amount || 0),
      todaySusuDeposits: todaySusuAgg._sum.amount || 0,
      todaySusuWithdrawals: todaySusuWithAgg._sum.amount || 0,
      trends,
    };
  }

  async getOfficerDashboardMetrics(officerId: string) {
    const totalLoans = await this.prisma.loan.count({ where: { officerId } });
    const activeLoans = await this.prisma.loan.count({ where: { officerId, status: 'ACTIVE' } });
    const completedLoans = await this.prisma.loan.count({ where: { officerId, status: 'COMPLETED' } });
    const defaultedLoans = await this.prisma.loan.count({ where: { officerId, status: 'DEFAULTED' } });

    const totalAmountAgg = await this.prisma.loan.aggregate({
      where: { officerId },
      _sum: { amount: true, totalRepayable: true }
    });
    
    const loans = await this.prisma.loan.findMany({
        where: { officerId },
        select: { id: true }
    });
    const loanIds = loans.map(l => l.id);

    const repaymentsAgg = await this.prisma.repayment.aggregate({
      where: { loanId: { in: loanIds } },
      _sum: { amount: true }
    });

    const susuAgg = await this.prisma.susuContribution.aggregate({
        where: { officerId },
        _sum: { amount: true }
    });
    const susuWithAgg = await this.prisma.susuWithdrawal.aggregate({
        where: { officerId, status: 'APPROVED' },
        _sum: { amount: true }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySusuAgg = await this.prisma.susuContribution.aggregate({
        where: { officerId, collectedAt: { gte: todayStart } },
        _sum: { amount: true }
    });
    const todaySusuWithAgg = await this.prisma.susuWithdrawal.aggregate({
        where: { officerId, status: 'APPROVED', withdrawnAt: { gte: todayStart } },
        _sum: { amount: true }
    });

    const parStats = await this.calculatePARStats(officerId);
    const trends = await this.getMonthlyTrends(officerId);
    const collectionEfficiency = await this.calculateCollectionEfficiency(officerId);
    const customerStats = await this.getCustomerStats(officerId);

    return {
        totalLoans,
        activeLoans,
        completedLoans,
        defaultedLoans,
        totalDisbursed: totalAmountAgg._sum.amount || 0,
        totalExpectedReturn: totalAmountAgg._sum.totalRepayable || 0,
        totalCollected: repaymentsAgg._sum.amount || 0,
        outstandingBalance: (totalAmountAgg._sum.totalRepayable || 0) - (repaymentsAgg._sum.amount || 0),
        customerStats,
        totalSusu: (susuAgg._sum.amount || 0) - (susuWithAgg._sum.amount || 0),
        totalSusuDeposits: susuAgg._sum.amount || 0,
        totalSusuWithdrawals: susuWithAgg._sum.amount || 0,
        todaySusu: (todaySusuAgg._sum.amount || 0) - (todaySusuWithAgg._sum.amount || 0),
        todaySusuDeposits: todaySusuAgg._sum.amount || 0,
        todaySusuWithdrawals: todaySusuWithAgg._sum.amount || 0,
        parStats,
        trends,
        collectionEfficiency,
    };
  }

  private async getCustomerStats(officerId?: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const baseWhere: any = {};
    if (officerId) {
      baseWhere.officerId = officerId;
    }

    const totalCustomers = await this.prisma.customer.count({ where: baseWhere });
    const newCustomersThisMonth = await this.prisma.customer.count({
      where: {
        ...baseWhere,
        createdAt: { gte: monthStart },
      },
    });
    const customersWithLoans = await this.prisma.customer.count({
      where: {
        ...baseWhere,
        loans: { some: {} },
      },
    });
    const customersWithGhanaCard = await this.prisma.customer.count({
      where: {
        ...baseWhere,
        ghanaCardNumber: { not: null },
      },
    });

    return {
      totalCustomers,
      newCustomersThisMonth,
      customersWithLoans,
      customersWithoutLoans: totalCustomers - customersWithLoans,
      customersWithGhanaCard,
      customersWithoutGhanaCard: totalCustomers - customersWithGhanaCard,
    };
  }

  private async calculatePARStats(officerId?: string) {
    const now = new Date();
    
    const getOverdueAmount = async (daysMin: number, daysMax?: number) => {
        const dateMax = new Date();
        dateMax.setDate(now.getDate() - daysMin);
        
        const where: any = {
            paid: false,
            dueDate: { lt: dateMax }
        };

        if (daysMax) {
            const dateMin = new Date();
            dateMin.setDate(now.getDate() - daysMax);
            where.dueDate.gte = dateMin;
        }

        if (officerId) {
            where.loan = { officerId };
        }

        const agg = await this.prisma.installment.aggregate({
            where,
            _sum: { amount: true }
        });
        return agg._sum.amount || 0;
    };

    return {
        par1to30: await getOverdueAmount(1, 30),
        par31to60: await getOverdueAmount(31, 60),
        par61to90: await getOverdueAmount(61, 90),
        par90Plus: await getOverdueAmount(91),
    };
  }

  private async calculateCollectionEfficiency(officerId?: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const expectedWhere: any = {
        dueDate: { gte: monthStart, lte: now }
    };
    const actualWhere: any = {
        paidAt: { gte: monthStart, lte: now }
    };

    if (officerId) {
        expectedWhere.loan = { officerId };
        actualWhere.loan = { officerId };
    }

    const expected = await this.prisma.installment.aggregate({
        where: expectedWhere,
        _sum: { amount: true }
    });

    const actual = await this.prisma.repayment.aggregate({
        where: actualWhere,
        _sum: { amount: true }
    });

    const expectedAmount = expected._sum.amount || 0;
    if (expectedAmount === 0) return 100;
    return (actual._sum.amount || 0) / expectedAmount * 100;
  }

  private async getMonthlyTrends(officerId?: string) {
    const months: any[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        
        const loanWhere: any = { createdAt: { gte: start, lte: end } };
        const susuWhere: any = { collectedAt: { gte: start, lte: end } };

        if (officerId) {
            loanWhere.officerId = officerId;
            susuWhere.officerId = officerId;
        }

        const loans = await this.prisma.loan.aggregate({
            where: loanWhere,
            _sum: { amount: true }
        });

        const susu = await this.prisma.susuContribution.aggregate({
            where: susuWhere,
            _sum: { amount: true }
        });

        const susuWithWhere: any = { status: 'APPROVED', withdrawnAt: { gte: start, lte: end } };
        if (officerId) susuWithWhere.officerId = officerId;
        
        const susuWith = await this.prisma.susuWithdrawal.aggregate({
            where: susuWithWhere,
            _sum: { amount: true }
        });

        months.push({
            month: monthLabel,
            loans: loans._sum.amount || 0,
            susu: (susu._sum.amount || 0) - (susuWith._sum.amount || 0)
        });
    }
    return months;
  }
}

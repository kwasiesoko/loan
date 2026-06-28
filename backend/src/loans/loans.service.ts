import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService
  ) {}

  async createLoan(officerId: string, data: any) {
    const { 
      customerId, 
      amount, 
      interestRate, 
      durationMonths, 
      interestModel = 'FLAT', 
      repaymentFrequency = 'MONTHLY' 
    } = data;

    let totalRepayable = 0;
    let installmentAmount = 0;
    let numberOfInstallments = durationMonths;

    if (repaymentFrequency === 'WEEKLY') {
      numberOfInstallments = durationMonths * 4;
    }

    if (interestModel === 'FLAT') {
      const periodicRate = (interestRate === 20) ? (interestRate / 100) / 3 : (interestRate / 100);
      const totalInterest = amount * periodicRate * durationMonths;
      totalRepayable = amount + totalInterest;
      installmentAmount = totalRepayable / numberOfInstallments;
    } else {
      let r;
      if (repaymentFrequency === 'WEEKLY') {
          r = (interestRate / 100) / 12;
      } else {
          r = interestRate / 100;
      }
      const n = numberOfInstallments;
      installmentAmount = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalRepayable = installmentAmount * n;
    }

    const loan = await this.prisma.loan.create({
      data: {
        customerId,
        officerId,
        amount,
        interestRate,
        interestModel,
        durationMonths,
        repaymentFrequency,
        monthlyPayment: repaymentFrequency === 'MONTHLY' ? installmentAmount : installmentAmount * 4,
        totalRepayable,
      },
      include: { customer: true }
    });

    const installments: any[] = [];
    let currentDate = new Date();
    for (let i = 1; i <= numberOfInstallments; i++) {
        if (repaymentFrequency === 'WEEKLY') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        installments.push({
            loanId: loan.id,
            dueDate: new Date(currentDate),
            amount: installmentAmount,
        });
    }
    await this.prisma.installment.createMany({ data: installments });

    try {
      const freqText = repaymentFrequency === 'WEEKLY' ? 'Weekly' : 'Monthly';
      const message = `Hello ${loan.customer.firstName}, your loan of GHS ${amount} has been disbursed successfully. ${freqText} installment: GHS ${installmentAmount.toFixed(2)}. Thank you for choosing Real & Fast.`;
      await this.smsService.sendSms(loan.customer.phone, message);
      await this.prisma.notification.create({
        data: { customerId: loan.customerId, type: 'SMS', message: message, status: 'SENT' }
      });
    } catch (e) {
      console.error('Failed to send loan SMS:', e.message);
    }

    return loan;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async applyPenalties() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 0. Send Reminders (3 days before due date)
    const reminderTargetDate = new Date(today);
    reminderTargetDate.setDate(reminderTargetDate.getDate() + 3);
    const startOfReminderDay = new Date(reminderTargetDate);
    const endOfReminderDay = new Date(reminderTargetDate);
    endOfReminderDay.setHours(23, 59, 59, 999);

    const upcomingInstallments = await this.prisma.installment.findMany({
      where: { 
        paid: false, 
        dueDate: { gte: startOfReminderDay, lte: endOfReminderDay } 
      },
      include: { loan: { include: { customer: true } } }
    });

    for (const inst of upcomingInstallments) {
      try {
        const message = `Dear Customer, This is a reminder that your loan repayment of GHS ${inst.amount.toFixed(2)} is due on ${inst.dueDate.toISOString().split('T')[0]}. Please ensure payment is made on or before the due date. Thank you for choosing REAL AND FAST POINT ENT.`;
        await this.smsService.sendSms(inst.loan.customer.phone, message);
        await this.prisma.notification.create({
          data: { customerId: inst.loan.customerId, type: 'SMS', message: message, status: 'SENT' }
        });
      } catch (e) {
        console.error('Failed to send reminder SMS:', e.message);
      }
    }

    // 1. Overdue Penalties (1% on missed installment after 3 days)
    const overdueInstallments = await this.prisma.installment.findMany({
      where: { paid: false, dueDate: { lt: today } },
      include: { loan: { include: { customer: true } } }
    });

    const OVERDUE_PENALTY_RATE = 0.01; // 1%
    for (const inst of overdueInstallments) {
      const diffTime = Math.abs(today.getTime() - inst.dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 3) {
        const penaltyAmount = inst.amount * OVERDUE_PENALTY_RATE;
        const newAmount = inst.amount + penaltyAmount;

        await this.prisma.installment.update({
          where: { id: inst.id },
          data: { penaltyAmount: inst.penaltyAmount + penaltyAmount, amount: newAmount }
        });
        
        await this.prisma.loan.update({
          where: { id: inst.loanId },
          data: { totalRepayable: inst.loan.totalRepayable + penaltyAmount }
        });

        try {
          const message = `Dear Customer, Your loan installment payment is overdue. A 1% overdue charge has been applied to your account. Kindly make payment immediately to avoid additional penalties. REAL AND FAST POINT ENT.`;
          await this.smsService.sendSms(inst.loan.customer.phone, message);
          await this.prisma.notification.create({
            data: { customerId: inst.loan.customerId, type: 'SMS', message: message, status: 'SENT' }
          });
        } catch (e) {
          console.error('Failed to send overdue SMS:', e.message);
        }
      }
    }

    // 2. Default Penalties (12.5% on outstanding balance after 31 days)
    const CRITICAL_THRESHOLD_DAYS = 31; 
    const DEFAULT_PENALTY_RATE = 0.125; 

    const criticalLoans = await this.prisma.loan.findMany({
        where: {
            status: 'ACTIVE',
            installments: { some: { paid: false, dueDate: { lt: new Date(today.getTime() - (CRITICAL_THRESHOLD_DAYS - 1) * 24 * 60 * 60 * 1000) } } }
        },
        include: { 
            installments: { where: { paid: false }, orderBy: { dueDate: 'asc' } }, 
            customer: true,
            repayments: true 
        }
    });

    for (const loan of criticalLoans) {
        const firstUnpaid = loan.installments[0];
        const diffTime = Math.abs(today.getTime() - firstUnpaid.dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === CRITICAL_THRESHOLD_DAYS) {
            const totalPaid = loan.repayments.reduce((sum: number, r: any) => sum + r.amount, 0);
            const outstandingBalance = Math.max(0, loan.totalRepayable - totalPaid);
            const penalty = outstandingBalance * DEFAULT_PENALTY_RATE;
            const newTotalRepayable = loan.totalRepayable + penalty;
            
            await this.prisma.loan.update({
                where: { id: loan.id },
                data: { status: 'DEFAULTED', totalRepayable: newTotalRepayable }
            });

            await this.prisma.installment.update({
                where: { id: firstUnpaid.id },
                data: { penaltyAmount: firstUnpaid.penaltyAmount + penalty, amount: firstUnpaid.amount + penalty }
            });

            try {
              const message = `Dear Customer, Your loan account has entered default status after thirty-one (31) days of non-payment. A default charge of 12.5% has been applied. Please make payment immediately or contact our office. REAL AND FAST POINT ENT.`;
              await this.smsService.sendSms(loan.customer.phone, message);
              await this.prisma.notification.create({
                data: { customerId: loan.customerId, type: 'SMS', message: message, status: 'SENT' }
              });
            } catch (e) {
              console.error('Failed to send default SMS:', e.message);
            }
        }
    }
  }

  async getParReport(officerId?: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overdueDate30 = new Date(today);
    overdueDate30.setDate(today.getDate() - 1); // unpaid, 1–30 days overdue
    const criticalDate = new Date(today);
    criticalDate.setDate(today.getDate() - 31); // unpaid, 31+ days overdue

    const baseWhere: any = { paid: false, isDeleted: false };
    if (officerId) baseWhere.loan = { officerId };

    const allOverdue = await this.prisma.installment.findMany({
      where: { ...baseWhere, dueDate: { lt: today } },
      include: { loan: { include: { customer: true, officer: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const withDays = allOverdue.map(inst => {
      const diffMs = today.getTime() - inst.dueDate.getTime();
      const daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { ...inst, daysOverdue };
    });

    const overdue = withDays.filter(i => i.daysOverdue >= 1 && i.daysOverdue <= 30);
    const critical = withDays.filter(i => i.daysOverdue >= 31);

    const overdueTotal = overdue.reduce((s, i) => s + i.amount, 0);
    const criticalTotal = critical.reduce((s, i) => s + i.amount, 0);

    return {
      overdue,
      critical,
      summary: {
        overdueCount: overdue.length,
        criticalCount: critical.length,
        overdueTotal,
        criticalTotal,
        totalPar: overdueTotal + criticalTotal,
      }
    };
  }

  async testGetLoansByOfficer(officerId: string) {
      return this.prisma.loan.findMany({
          where: { officerId },
          include: { customer: true, installments: true, repayments: true }
      });
  }

  async getAllLoans() {
      return this.prisma.loan.findMany({
          where: { isDeleted: false },
          include: { customer: true, officer: true, repayments: true, installments: true }
      });
  }

  async getLoanDetails(id: string) {
      return this.prisma.loan.findUnique({
          where: { id, isDeleted: false },
          include: {
              customer: true,
              installments: { where: { isDeleted: false } },
              repayments: { where: { isDeleted: false } }
          }
      });
  }

  async createRepayment(loanId: string, amount: number, note?: string) {
      const loan = await this.prisma.loan.findUnique({
          where: { id: loanId },
          include: { 
            customer: true,
            installments: { where: { paid: false }, orderBy: { dueDate: 'asc' } } 
          }
      });

      if (!loan) throw new BadRequestException('Loan not found');

      // Add Repayment Record
      const repayment = await this.prisma.repayment.create({
          data: { loanId, amount, note }
      });

      // Update Installments starting from the earliest unpaid
      let remainingAmount = amount;
      const EPSILON = 0.01; // 1 pesewa tolerance

      for (const inst of loan.installments) {
          if (remainingAmount <= 0) break;

          if (remainingAmount >= (inst.amount - EPSILON)) {
              await this.prisma.installment.update({
                  where: { id: inst.id },
                  data: { 
                    paid: true, 
                    paidAt: new Date(),
                    amount: 0 // Fully paid
                  }
              });
              remainingAmount -= inst.amount;
          } else {
              // Partial payments on an installment
              await this.prisma.installment.update({
                  where: { id: inst.id },
                  data: { amount: Math.max(0, inst.amount - remainingAmount) }
              });
              remainingAmount = 0;
          }
      }

      // Check if loan is completed
      const totalPaidAgg = await this.prisma.repayment.aggregate({
          where: { loanId },
          _sum: { amount: true }
      });

      const totalPaid = totalPaidAgg._sum.amount || 0;
      const outstanding = Math.max(0, loan.totalRepayable - totalPaid);

      if (totalPaid >= loan.totalRepayable) {
          await this.prisma.loan.update({
              where: { id: loanId },
              data: { status: 'COMPLETED' }
          });
      }

      // Send SMS Alert
      try {
        const message = `Payment Received: GHS ${amount} has been credited to your loan account. Remaining balance: GHS ${outstanding.toFixed(2)}. Thank you for your payment.`;
        await this.smsService.sendSms(loan.customer.phone, message);
        
        await this.prisma.notification.create({
          data: {
            customerId: loan.customerId,
            type: 'SMS',
            message: message,
            status: 'SENT'
          }
        });
      } catch (e) {
        console.error('Failed to send repayment SMS:', e.message);
      }

      return repayment;
  }
}

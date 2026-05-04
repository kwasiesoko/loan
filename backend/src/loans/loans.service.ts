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
    
    // 1. Overdue Flat Penalties
    const overdueInstallments = await this.prisma.installment.findMany({
      where: { paid: false, dueDate: { lt: now } },
      include: { loan: true }
    });

    const PENALTY_FLAT_AMOUNT = 5; 
    for (const inst of overdueInstallments) {
      const diffTime = Math.abs(now.getTime() - inst.dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 3 && inst.penaltyAmount === 0) {
        await this.prisma.installment.update({
          where: { id: inst.id },
          data: { penaltyAmount: PENALTY_FLAT_AMOUNT, amount: inst.amount + PENALTY_FLAT_AMOUNT }
        });
      }
    }

    // 2. Default Penalties (13.5% on Principal)
    const DEFAULT_THRESHOLD_DAYS = 14; 
    const DEFAULT_PENALTY_RATE = 0.135; 

    const potentialDefaults = await this.prisma.loan.findMany({
        where: {
            status: 'ACTIVE',
            installments: { some: { paid: false, dueDate: { lt: new Date(now.getTime() - DEFAULT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000) } } }
        },
        include: { installments: { where: { paid: false }, orderBy: { dueDate: 'asc' } }, customer: true }
    });

    for (const loan of potentialDefaults) {
        const penalty = loan.amount * DEFAULT_PENALTY_RATE;
        const newTotalRepayable = loan.totalRepayable + penalty;
        
        await this.prisma.loan.update({
            where: { id: loan.id },
            data: { status: 'DEFAULTED', totalRepayable: newTotalRepayable }
        });

        const firstUnpaid = loan.installments[0];
        if (firstUnpaid) {
            await this.prisma.installment.update({
                where: { id: firstUnpaid.id },
                data: { penaltyAmount: firstUnpaid.penaltyAmount + penalty, amount: firstUnpaid.amount + penalty }
            });
        }

        try {
          const message = `URGENT: Your loan has been marked as DEFAULTED. A penalty of GHS ${penalty.toFixed(2)} (13.5% of principal) has been added. New total: GHS ${newTotalRepayable.toFixed(2)}.`;
          await this.smsService.sendSms(loan.customer.phone, message);
          await this.prisma.notification.create({
            data: { customerId: loan.customerId, type: 'SMS', message: message, status: 'SENT' }
          });
        } catch (e) {
          console.error('Failed to send default SMS:', e.message);
        }
    }
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

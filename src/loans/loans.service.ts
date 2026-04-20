import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  async createLoan(officerId: string, data: any) {
    const { customerId, amount, interestRate, durationMonths, interestModel = 'FLAT' } = data;

    let totalRepayable = 0;
    let monthlyPayment = 0;

    if (interestModel === 'FLAT') {
      // Calculate Flat-Rate Interest (using total rate for the duration)
      const totalInterest = (amount * interestRate) / 100;
      totalRepayable = amount + totalInterest;
      monthlyPayment = totalRepayable / durationMonths;
    } else {
      // Calculate Reducing-Balance (Amortization)
      // r = monthly interest rate
      const r = (interestRate / 100); 
      const n = durationMonths;
      
      // Standard EMI formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
      // If we assume the interestRate passed is the MONTHLY rate (common in microfinance)
      monthlyPayment = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalRepayable = monthlyPayment * n;
    }

    // Create loan
    const loan = await this.prisma.loan.create({
      data: {
        customerId,
        officerId,
        amount,
        interestRate,
        interestModel,
        durationMonths,
        monthlyPayment,
        totalRepayable,
      },
    });

    // Generate monthly installments
    const installments: any[] = [];
    let currentDate = new Date();
    
    for (let i = 1; i <= durationMonths; i++) {
        currentDate.setMonth(currentDate.getMonth() + 1);
        installments.push({
            loanId: loan.id,
            dueDate: new Date(currentDate),
            amount: monthlyPayment,
        });
    }

    await this.prisma.installment.createMany({
        data: installments,
    });

    return loan;
  }

  // Penalty Logic: Run via Cron
  async applyPenalties() {
    const now = new Date();
    const overdueInstallments = await this.prisma.installment.findMany({
      where: {
        paid: false,
        dueDate: { lt: now },
        // Only apply if not already penalized today (simple check)
      },
      include: { loan: true }
    });

    const PENALTY_FLAT_AMOUNT = 5; // GHS 5 penalty per overdue day/week/incident

    for (const inst of overdueInstallments) {
      // Example: Apply penalty once if it's 3 days overdue
      const diffTime = Math.abs(now.getTime() - inst.dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 3 && inst.penaltyAmount === 0) {
        await this.prisma.installment.update({
          where: { id: inst.id },
          data: { 
            penaltyAmount: PENALTY_FLAT_AMOUNT,
            amount: inst.amount + PENALTY_FLAT_AMOUNT 
          }
        });
      }
    }
  }

  async testGetLoansByOfficer(officerId: string) {
      return this.prisma.loan.findMany({
          where: { officerId },
          include: { customer: true, installments: true }
      });
  }

  async getAllLoans() {
      return this.prisma.loan.findMany({
          include: { customer: true, officer: true, repayments: true }
      });
  }

  async getLoanDetails(id: string) {
      return this.prisma.loan.findUnique({
          where: { id },
          include: {
              customer: true,
              installments: true,
              repayments: true
          }
      });
  }

  async createRepayment(loanId: string, amount: number, note?: string) {
      const loan = await this.prisma.loan.findUnique({
          where: { id: loanId },
          include: { installments: { where: { paid: false }, orderBy: { dueDate: 'asc' } } }
      });

      if (!loan) throw new BadRequestException('Loan not found');

      // Add Repayment Record
      const repayment = await this.prisma.repayment.create({
          data: { loanId, amount, note }
      });

      // Update Installments starting from the earliest unpaid
      let remainingAmount = amount;
      for (const inst of loan.installments) {
          if (remainingAmount <= 0) break;

          if (remainingAmount >= inst.amount) {
              await this.prisma.installment.update({
                  where: { id: inst.id },
                  data: { paid: true, paidAt: new Date() }
              });
              remainingAmount -= inst.amount;
          } else {
              // Partial payments on an installment
              await this.prisma.installment.update({
                  where: { id: inst.id },
                  data: { amount: inst.amount - remainingAmount } // Simply reduce amount due
              });
              remainingAmount = 0;
          }
      }

      // Check if loan is completed
      const totalPaid = await this.prisma.repayment.aggregate({
          where: { loanId },
          _sum: { amount: true }
      });

      if (totalPaid._sum.amount && totalPaid._sum.amount >= loan.totalRepayable) {
          await this.prisma.loan.update({
              where: { id: loanId },
              data: { status: 'COMPLETED' }
          });
      }

      return repayment;
  }
}

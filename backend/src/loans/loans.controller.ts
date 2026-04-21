import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  async createLoan(@Req() req: any, @Body() body: any) {
    // req.user is supplied by JwtStrategy
    return this.loansService.createLoan(req.user.id, body);
  }

  @Get()
  async getAllLoans(@Req() req: any) {
      if (req.user.role === 'ADMIN') {
          return this.loansService.getAllLoans();
      }
      return this.loansService.testGetLoansByOfficer(req.user.id);
  }

  @Get('my-loans')
  async getMyLoans(@Req() req: any) {
      return this.loansService.testGetLoansByOfficer(req.user.id);
  }

  @Get(':id')
  async getLoanDetails(@Param('id') id: string) {
      return this.loansService.getLoanDetails(id);
  }

  @Post(':id/repayments')
  async recordRepayment(@Param('id') id: string, @Body() body: any) {
      return this.loansService.createRepayment(id, body.amount, body.note);
  }

  @Get('export/csv')
  async exportCsv(@Req() req: any) {
    const loans = await this.loansService.getAllLoans();
    const headers = ['ID', 'Customer', 'Amount', 'Interest Rate', 'Model', 'Status', 'Disbursed At'];
    const rows = loans.map(l => [
      l.id,
      `${l.customer.firstName} ${l.customer.lastName}`,
      l.amount,
      l.interestRate,
      l.interestModel,
      l.status,
      l.disbursedAt.toISOString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csvContent;
  }
}

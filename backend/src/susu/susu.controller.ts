import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SusuService } from './susu.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('susu')
export class SusuController {
  constructor(private readonly susuService: SusuService) {}

  @Post('deposit')
  async createContribution(@Req() req: any, @Body() body: any) {
    return this.susuService.createContribution(req.user.id, body);
  }

  @Post('withdraw')
  async createWithdrawal(@Req() req: any, @Body() body: any) {
    return this.susuService.createWithdrawal(req.user.id, body);
  }

  @Get('contributions')
  async getContributions(@Req() req: any) {
    if (req.user.role === 'ADMIN') {
        return this.susuService.getContributions();
    }
    return this.susuService.getContributionsByOfficer(req.user.id);
  }

  @Get('withdrawals')
  async getWithdrawals(@Req() req: any) {
    if (req.user.role === 'ADMIN') {
        return this.susuService.getWithdrawals();
    }
    return this.susuService.getWithdrawalsByOfficer(req.user.id);
  }

  @Get('balance/:customerId')
  async getBalance(@Param('customerId') customerId: string) {
    return { balance: await this.susuService.getCustomerBalance(customerId) };
  }

  @Get('customer/:customerId')
  async getCustomerContributions(@Param('customerId') customerId: string) {
    return this.susuService.getCustomerContributions(customerId);
  }
}

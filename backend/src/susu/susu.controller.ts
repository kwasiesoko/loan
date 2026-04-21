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
  async getContributions() {
    return this.susuService.getContributions();
  }

  @Get('withdrawals')
  async getWithdrawals() {
    return this.susuService.getWithdrawals();
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

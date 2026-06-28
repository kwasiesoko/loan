import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getNotifications(@Req() req: any, @Query('limit') limit?: string) {
    const take = Math.min(parseInt(limit || '50', 10), 100);

    if (req.user.role === 'ADMIN') {
      return this.prisma.notification.findMany({
        orderBy: { sentAt: 'desc' },
        take,
        include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
      });
    }

    // Officers only see notifications for their own customers
    return this.prisma.notification.findMany({
      where: {
        customer: { officerId: req.user.id },
      },
      orderBy: { sentAt: 'desc' },
      take,
      include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
    });
  }
}

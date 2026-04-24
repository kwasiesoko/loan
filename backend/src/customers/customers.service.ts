import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(officerId: string, data: any) {
    return this.prisma.customer.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        ghanaCardNumber: data.ghanaCardNumber || null,
        ghanaCardFront: data.ghanaCardFront || '',
        ghanaCardBack: data.ghanaCardBack || '',
        photo: data.photo || null,
        officerId,
      },
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllByOfficer(officerId: string) {
    return this.prisma.customer.findMany({
      where: { officerId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { loans: true }
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }
}

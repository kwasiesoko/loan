import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService
  ) {}

  async create(officerId: string, data: any) {
    const customer = await this.prisma.customer.create({
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

    // Send SMS Alert
    try {
      const message = `Hello ${customer.firstName}, welcome to Real & Fast Point Ent. Your account has been successfully created. For enquiries, call us on 050XXXXXXX.`;
      await this.smsService.sendSms(customer.phone, message);
      
      await this.prisma.notification.create({
        data: {
          customerId: customer.id,
          type: 'SMS',
          message: message,
          status: 'SENT'
        }
      });
    } catch (e) {
      console.error('Failed to send welcome SMS:', e.message);
    }

    return customer;
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
      include: { loans: true, susuContributions: true, susuWithdrawals: true }
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, data: any) {
    // We only update provided fields
    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.ghanaCardNumber !== undefined) updateData.ghanaCardNumber = data.ghanaCardNumber;

    return this.prisma.customer.update({
      where: { id },
      data: updateData
    });
  }
}

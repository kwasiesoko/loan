import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(data: any) {
    const { email, password, name, role } = data;
    
    const existing = await this.prisma.loanOfficer.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const officer = await this.prisma.loanOfficer.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'OFFICER'
      }
    });

    return this.generateToken(officer);
  }

  async login(data: any) {
    const { email, password } = data;
    const officer = await this.prisma.loanOfficer.findUnique({ where: { email } });

    if (!officer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, officer.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(officer);
  }

  private generateToken(officer: any) {
    const payload = { email: officer.email, sub: officer.id, role: officer.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        role: officer.role
      }
    };
  }
}

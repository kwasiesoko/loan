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

  async requestPasswordReset(email: string) {
    const officer = await this.prisma.loanOfficer.findUnique({ where: { email } });
    if (!officer) return { message: 'If that email exists, a reset code has been sent.' };

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour expiry

    await this.prisma.loanOfficer.update({
      where: { id: officer.id },
      data: {
        resetPasswordToken: resetCode,
        resetPasswordExpires: expiry
      }
    });

    // In a real system, send email/SMS here
    console.log(`Password reset code for ${email}: ${resetCode}`);

    return { 
      message: 'Reset code generated successfully',
      debug_code: resetCode // Returning code for easy testing in this env
    };
  }

  async resetPassword(data: any) {
    const { token, newPassword } = data;

    const officer = await this.prisma.loanOfficer.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gte: new Date() }
      }
    });

    if (!officer) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.loanOfficer.update({
      where: { id: officer.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return { message: 'Password reset successful' };
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

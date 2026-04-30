import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey = process.env.SMS_API_KEY || 'SlJ2dHRPVXNUblVNVGNDeHV4R2g';
  private readonly senderId = process.env.SMS_SENDER_ID || 'meddibuddy';
  private readonly apiUrl = process.env.SMS_API_URL || 'https://sms.arkesel.com/sms/api';

  async sendSms(to: string, message: string) {
    if (!this.apiKey) {
      this.logger.warn('SMS NOT SENT: Arkesel API Key not configured');
      return;
    }

    const formattedTo = this.formatPhoneNumber(to);
    
    // Arkesel v1 uses GET request parameters
    const params = new URLSearchParams({
      action: 'send-sms',
      api_key: this.apiKey,
      to: formattedTo,
      from: this.senderId,
      sms: message
    });

    const fullUrl = `${this.apiUrl}?${params.toString()}`;

    return new Promise((resolve, reject) => {
      https.get(fullUrl, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          this.logger.log(`SMS Sent Status: ${res.statusCode} | Response: ${responseBody}`);
          resolve(responseBody);
        });
      }).on('error', (error) => {
        this.logger.error(`SMS Sending Error: ${error.message}`);
        reject(error);
      });
    });
  }

  private formatPhoneNumber(phone: string): string {
    // Basic Ghana format helper
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0') && clean.length === 10) {
      return '233' + clean.substring(1);
    }
    if (clean.length === 9) {
      return '233' + clean;
    }
    return clean;
  }
}

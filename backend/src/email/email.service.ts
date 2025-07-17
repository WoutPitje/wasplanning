import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { EmailJobData, EmailJobResult } from './interfaces/email-job.interface';
import { EmailType } from './enums/email-type.enum';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';

    if (isDevelopment) {
      // Use MailHog for development
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false,
      } as any);
      this.logger.log(
        'Email transporter configured for development with MailHog',
      );
    } else {
      // Use configured SMTP for production
      const smtpConfig = {
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT') || 587,
        secure: this.configService.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASSWORD'),
        },
      };

      this.logger.log(
        `Email transporter configured for production: ${smtpConfig.host}:${smtpConfig.port}`,
      );
      this.transporter = nodemailer.createTransport(smtpConfig as any);
    }

    // Verify default from email is configured
    const fromEmail =
      this.configService.get('SMTP_FROM_EMAIL') || 'noreply@wasplanning.nl';
    if (!this.isValidEmail(fromEmail)) {
      this.logger.warn(
        `Invalid SMTP_FROM_EMAIL configured: ${fromEmail}. Using fallback: noreply@wasplanning.nl`,
      );
    }
  }

  async sendEmail(emailData: EmailJobData): Promise<EmailJobResult> {
    try {
      const html = await this.renderTemplate(
        emailData.template,
        emailData.data,
      );

      // Get from email with fallback
      const fromEmail =
        emailData.from ||
        this.configService.get('SMTP_FROM_EMAIL') ||
        'noreply@wasplanning.nl';

      // Validate email format
      if (!this.isValidEmail(fromEmail)) {
        throw new Error(`Invalid from email address: ${fromEmail}`);
      }

      if (!this.isValidEmail(emailData.to)) {
        throw new Error(`Invalid to email address: ${emailData.to}`);
      }

      const mailOptions = {
        from: fromEmail,
        to: emailData.to,
        subject: emailData.subject,
        html,
        replyTo: emailData.replyTo,
      };

      this.logger.debug(`Sending email from ${fromEmail} to ${emailData.to}`);
      const result = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully to ${emailData.to}`);

      return {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${emailData.to}:`,
        (error as Error).message,
      );
      throw error;
    }
  }

  async sendWelcomeEmail(
    email: string,
    userData: {
      firstName: string;
      lastName: string;
      temporaryPassword?: string;
      tenantName: string;
    },
  ): Promise<void> {
    const emailData: EmailJobData = {
      to: email,
      subject: 'Welkom bij het Wasplanning Systeem',
      template: EmailType.USER_WELCOME,
      data: {
        ...userData,
        to: email, // Add email to template data
      },
    };

    await this.sendEmail(emailData);
  }

  async sendLimitWarningEmail(
    email: string,
    data: {
      firstName: string;
      limitType: string;
      currentUsage: number;
      limit: number;
      percentage: number;
    },
  ): Promise<void> {
    const emailData: EmailJobData = {
      to: email,
      subject: `Waarschuwing: Limiet ${data.limitType} bijna bereikt`,
      template: EmailType.LIMIT_WARNING,
      data: {
        ...data,
        to: email,
      },
    };

    await this.sendEmail(emailData);
  }

  async sendPaymentFailedEmail(
    email: string,
    data: {
      firstName: string;
      tenantName: string;
      amount: number;
      currency: string;
      attemptCount: number;
      nextRetryDate?: Date;
    },
  ): Promise<void> {
    const emailData: EmailJobData = {
      to: email,
      subject: 'Betalingsprobleem - Actie vereist',
      template: EmailType.PAYMENT_FAILED,
      data: {
        ...data,
        to: email,
      },
    };

    await this.sendEmail(emailData);
  }

  async sendPaymentSucceededAfterFailureEmail(
    email: string,
    data: {
      firstName: string;
      tenantName: string;
      amount: number;
      currency: string;
    },
  ): Promise<void> {
    const emailData: EmailJobData = {
      to: email,
      subject: 'Betaling geslaagd - Abonnement hersteld',
      template: EmailType.PAYMENT_SUCCEEDED_AFTER_FAILURE,
      data: {
        ...data,
        to: email,
      },
    };

    await this.sendEmail(emailData);
  }

  async sendSubscriptionCanceledEmail(
    email: string,
    data: {
      firstName: string;
      tenantName: string;
      planName: string;
      endDate: Date;
    },
  ): Promise<void> {
    const emailData: EmailJobData = {
      to: email,
      subject: 'Abonnement beëindigd',
      template: EmailType.SUBSCRIPTION_CANCELED,
      data: {
        ...data,
        to: email,
      },
    };

    await this.sendEmail(emailData);
  }

  async sendGracePeriodWarningEmail(
    email: string,
    data: {
      firstName: string;
      tenantName: string;
      gracePeriodEnd: Date;
      daysRemaining: number;
    },
  ): Promise<void> {
    const emailData: EmailJobData = {
      to: email,
      subject: `Waarschuwing: Account wordt over ${data.daysRemaining} dagen beperkt`,
      template: EmailType.GRACE_PERIOD_WARNING,
      data: {
        ...data,
        to: email,
      },
    };

    await this.sendEmail(emailData);
  }

  private isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  private async renderTemplate(
    templateType: EmailType,
    data: Record<string, any>,
  ): Promise<string> {
    // Try multiple possible template locations in order of preference
    const templateLocations = [
      path.join(__dirname, 'templates', `${templateType}.hbs`), // Compiled dist location (preferred)
      path.join(
        process.cwd(),
        'src',
        'email',
        'templates',
        `${templateType}.hbs`,
      ), // Source location (development)
      path.join(
        process.cwd(),
        'backend',
        'src',
        'email',
        'templates',
        `${templateType}.hbs`,
      ), // Monorepo source location
    ];

    let templatePath: string | null = null;

    for (const location of templateLocations) {
      if (fs.existsSync(location)) {
        templatePath = location;
        this.logger.debug(`Found email template at: ${templatePath}`);
        break;
      }
    }

    if (!templatePath) {
      const errorMsg = `Template not found: ${templateType}. Checked locations: ${templateLocations.join(', ')}`;
      this.logger.error(errorMsg);
      throw new Error(`Template not found: ${templateType}`);
    }

    try {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);

      return template(data);
    } catch (error) {
      this.logger.error(
        `Failed to render template ${templateType}:`,
        (error as Error).message,
      );
      throw new Error(`Failed to render email template: ${templateType}`);
    }
  }
}

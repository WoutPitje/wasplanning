import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailType } from './enums/email-type.enum';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';

// Mock nodemailer
jest.mock('nodemailer');
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

// Mock fs
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('EmailService Error Handling', () => {
  let service: EmailService;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
    };
    mockNodemailer.createTransport.mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                NODE_ENV: 'test',
                SMTP_FROM_EMAIL: 'test@wasplanning.nl',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SMTP Connection Errors', () => {
    it('should handle SMTP connection timeout', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('<html>Test template</html>');

      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'TimeoutError';
      mockTransporter.sendMail.mockRejectedValue(timeoutError);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      await expect(service.sendEmail(emailData)).rejects.toThrow(
        'Connection timeout',
      );
    });

    it('should handle SMTP authentication errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('<html>Test template</html>');

      const authError = new Error('Invalid login: 535 Authentication failed');
      authError.name = 'AuthenticationError';
      mockTransporter.sendMail.mockRejectedValue(authError);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      await expect(service.sendEmail(emailData)).rejects.toThrow(
        'Invalid login: 535 Authentication failed',
      );
    });

    it('should handle network connectivity errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('<html>Test template</html>');

      const networkError = new Error('getaddrinfo ENOTFOUND smtp.invalid.com');
      networkError.name = 'NetworkError';
      mockTransporter.sendMail.mockRejectedValue(networkError);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      await expect(service.sendEmail(emailData)).rejects.toThrow(
        'getaddrinfo ENOTFOUND smtp.invalid.com',
      );
    });
  });

  describe('Template Rendering Errors', () => {
    it('should handle missing template file', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      await expect(service.sendEmail(emailData)).rejects.toThrow(
        'Template not found: user_welcome',
      );
    });

    it('should handle file read errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied reading template file');
      });

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      await expect(service.sendEmail(emailData)).rejects.toThrow(
        'Failed to render email template: user_welcome',
      );
    });

    it('should handle corrupted template content', async () => {
      mockFs.existsSync.mockReturnValue(true);
      // Handlebars should handle most template syntax errors gracefully
      mockFs.readFileSync.mockReturnValue('{{#invalid}}{{/notmatching}}');

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      // This might throw during template compilation
      await expect(service.sendEmail(emailData)).rejects.toThrow();
    });

    it('should handle template with undefined variables gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        'Hello {{undefinedVar}}, welcome {{firstName}}!',
      );
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-id',
        accepted: ['test@example.com'],
        rejected: [],
        response: 'OK',
      });

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' }, // undefinedVar is not provided
      };

      const result = await service.sendEmail(emailData);

      expect(result.messageId).toBe('test-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: 'Hello , welcome John!', // undefined variables become empty strings
        }),
      );
    });
  });

  describe('Email Validation Errors', () => {
    it('should handle invalid recipient email addresses', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('<html>Test template</html>');

      const validationError = new Error('Invalid recipients');
      validationError.name = 'AddressError';
      mockTransporter.sendMail.mockRejectedValue(validationError);

      const emailData = {
        to: 'invalid-email-address',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      await expect(service.sendEmail(emailData)).rejects.toThrow(
        'Invalid to email address: invalid-email-address',
      );
    });

    it('should handle rejected recipient addresses', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('<html>Test template</html>');

      // Simulate partial delivery failure
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'partial-success-id',
        accepted: [],
        rejected: ['bounced@example.com'],
        response: 'Some recipients rejected',
      });

      const emailData = {
        to: 'bounced@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      const result = await service.sendEmail(emailData);

      expect(result.rejected).toContain('bounced@example.com');
      expect(result.accepted).toHaveLength(0);
    });
  });

  describe('Welcome Email Error Scenarios', () => {
    it('should handle sendWelcomeEmail with missing user data', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        '<html>Welcome {{firstName}} {{lastName}}!</html>',
      );
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'welcome-id',
        accepted: ['test@example.com'],
        rejected: [],
        response: 'OK',
      });

      // Test with minimal user data
      await service.sendWelcomeEmail('test@example.com', {
        firstName: '', // Empty first name
        lastName: '', // Empty last name
        tenantName: 'Test Garage',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<html>Welcome  !</html>', // Empty names should render as empty
        }),
      );
    });

    it('should handle sendWelcomeEmail when template service fails', async () => {
      mockFs.existsSync.mockReturnValue(false); // Template doesn't exist

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        tenantName: 'Test Garage',
      };

      await expect(
        service.sendWelcomeEmail('test@example.com', userData),
      ).rejects.toThrow('Template not found: user_welcome');
    });
  });

  describe('Configuration Errors', () => {
    it('should handle missing SMTP configuration gracefully', async () => {
      // Create service with minimal configuration
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                // Return undefined for most SMTP settings
                if (key === 'NODE_ENV') return 'production';
                if (key === 'SMTP_FROM_EMAIL') return 'test@wasplanning.nl';
                return undefined;
              }),
            },
          },
        ],
      }).compile();

      const serviceWithMissingConfig = module.get<EmailService>(EmailService);

      // Should still create transporter with undefined values
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: undefined,
        port: 587, // Default port
        secure: false, // Default secure
        auth: {
          user: undefined,
          pass: undefined,
        },
      });
    });
  });

  describe('Concurrent Email Sending', () => {
    it('should handle multiple simultaneous email sends', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('<html>Test {{index}}</html>');

      // First call succeeds, second fails, third succeeds
      mockTransporter.sendMail
        .mockResolvedValueOnce({
          messageId: 'success-1',
          accepted: ['test1@example.com'],
          rejected: [],
          response: 'OK',
        })
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          messageId: 'success-3',
          accepted: ['test3@example.com'],
          rejected: [],
          response: 'OK',
        });

      const emailPromises = [
        service.sendEmail({
          to: 'test1@example.com',
          subject: 'Test 1',
          template: EmailType.USER_WELCOME,
          data: { index: 1 },
        }),
        service.sendEmail({
          to: 'test2@example.com',
          subject: 'Test 2',
          template: EmailType.USER_WELCOME,
          data: { index: 2 },
        }),
        service.sendEmail({
          to: 'test3@example.com',
          subject: 'Test 3',
          template: EmailType.USER_WELCOME,
          data: { index: 3 },
        }),
      ];

      const results = await Promise.allSettled(emailPromises);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');

      if (results[0].status === 'fulfilled') {
        expect(results[0].value.messageId).toBe('success-1');
      }
      if (results[2].status === 'fulfilled') {
        expect(results[2].value.messageId).toBe('success-3');
      }
    });
  });
});

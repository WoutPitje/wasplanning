import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailType } from './enums/email-type.enum';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

// Mock nodemailer
jest.mock('nodemailer');
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

// Mock fs
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let mockTransporter: any;

  beforeEach(async () => {
    // Setup mock transporter
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
                SMTP_HOST: 'localhost',
                SMTP_PORT: 1025,
                SMTP_SECURE: 'false',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransporter', () => {
    it('should create transporter for development environment', async () => {
      // Create new service with explicit development config
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config = {
                  NODE_ENV: 'development',
                  SMTP_FROM_EMAIL: 'dev@wasplanning.nl',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      const devService = module.get<EmailService>(EmailService);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'localhost',
        port: 1025,
        secure: false,
      });
    });

    it('should create transporter for production environment', async () => {
      // Create new service with production config
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const config = {
          NODE_ENV: 'production',
          SMTP_HOST: 'smtp.gmail.com',
          SMTP_PORT: 587,
          SMTP_SECURE: 'true',
          SMTP_USER: 'user@example.com',
          SMTP_PASSWORD: 'password123',
        };
        return config[key];
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const prodService = module.get<EmailService>(EmailService);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: true,
        auth: {
          user: 'user@example.com',
          pass: 'password123',
        },
      });
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      // Mock template file
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        '<html><body>Hello {{firstName}}!</body></html>',
      );
    });

    it('should send email successfully', async () => {
      const mockResult = {
        messageId: 'test-message-id',
        accepted: ['test@example.com'],
        rejected: [],
        response: 'OK',
      };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      const result = await service.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@wasplanning.nl',
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<html><body>Hello John!</body></html>',
        replyTo: undefined,
      });

      expect(result).toEqual({
        messageId: 'test-message-id',
        accepted: ['test@example.com'],
        rejected: [],
        response: 'OK',
      });
    });

    it('should use custom from email when provided', async () => {
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
        data: { firstName: 'John' },
        from: 'custom@example.com',
        replyTo: 'reply@example.com',
      };

      await service.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
          replyTo: 'reply@example.com',
        }),
      );
    });

    it('should throw error when email sending fails', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      await expect(service.sendEmail(emailData)).rejects.toThrow('SMTP Error');
    });

    it('should throw error for invalid from email address', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('<html>Test template</html>');

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
        from: 'invalid-email',
      };

      await expect(service.sendEmail(emailData)).rejects.toThrow(
        'Invalid from email address: invalid-email',
      );
    });

    it('should throw error for invalid to email address', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('<html>Test template</html>');

      const emailData = {
        to: 'invalid-email',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      await expect(service.sendEmail(emailData)).rejects.toThrow(
        'Invalid to email address: invalid-email',
      );
    });

    it('should use fallback from email when config is missing', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('<html>Test template</html>');
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-id',
        accepted: ['test@example.com'],
        rejected: [],
        response: 'OK',
      });

      // Mock configService to return undefined for SMTP_FROM_EMAIL
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'SMTP_FROM_EMAIL') return undefined;
        return 'test';
      });

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailType.USER_WELCOME,
        data: { firstName: 'John' },
      };

      await service.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@wasplanning.nl', // Should use fallback
        }),
      );
    });

    it('should throw error when template does not exist', async () => {
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
  });

  describe('sendWelcomeEmail', () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        '<html><body>Welcome {{firstName}}!</body></html>',
      );
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'welcome-id',
        accepted: ['user@example.com'],
        rejected: [],
        response: 'OK',
      });
    });

    it('should send welcome email with correct data', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        temporaryPassword: 'temp123',
        tenantName: 'Test Garage',
      };

      await service.sendWelcomeEmail('user@example.com', userData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@wasplanning.nl',
        to: 'user@example.com',
        subject: 'Welkom bij het Wasplanning Systeem',
        html: '<html><body>Welcome John!</body></html>',
        replyTo: undefined,
      });
    });

    it('should send welcome email without temporary password', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        tenantName: 'Another Garage',
      };

      await service.sendWelcomeEmail('jane@example.com', userData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jane@example.com',
          subject: 'Welkom bij het Wasplanning Systeem',
        }),
      );
    });
  });

  describe('renderTemplate', () => {
    it('should render template with provided data', async () => {
      // Mock existsSync to return true for first location
      mockFs.existsSync.mockImplementation((path) =>
        String(path).includes('templates'),
      );
      mockFs.readFileSync.mockReturnValue(
        'Hello {{name}}, your password is {{password}}',
      );

      const result = await service['renderTemplate'](EmailType.USER_WELCOME, {
        name: 'John',
        password: 'secret123',
      });

      expect(result).toBe('Hello John, your password is secret123');
    });

    it('should handle missing template file in all locations', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(
        service['renderTemplate'](EmailType.USER_WELCOME, {}),
      ).rejects.toThrow('Template not found: user_welcome');
    });

    it('should try multiple template locations', async () => {
      // Mock existsSync to return false for first call, true for second
      mockFs.existsSync
        .mockReturnValueOnce(false) // First location fails
        .mockReturnValueOnce(true); // Second location succeeds
      mockFs.readFileSync.mockReturnValue('Template found!');

      const result = await service['renderTemplate'](
        EmailType.USER_WELCOME,
        {},
      );

      expect(result).toBe('Template found!');
      expect(mockFs.existsSync).toHaveBeenCalledTimes(2); // Should try multiple locations
    });

    it('should render template with complex data structures', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        '{{#if hasPassword}}Password: {{password}}{{/if}}',
      );

      const result = await service['renderTemplate'](EmailType.USER_WELCOME, {
        hasPassword: true,
        password: 'temp123',
      });

      expect(result).toBe('Password: temp123');
    });

    it('should handle template read errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      await expect(
        service['renderTemplate'](EmailType.USER_WELCOME, {}),
      ).rejects.toThrow('Failed to render email template: user_welcome');
    });
  });
});

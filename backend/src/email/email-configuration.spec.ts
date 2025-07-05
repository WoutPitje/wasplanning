import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe('EmailService Configuration', () => {
  let service: EmailService;
  let mockTransporter: any;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn(),
    };
    mockNodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Development Configuration', () => {
    it('should configure MailHog for development environment', async () => {
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

      service = module.get<EmailService>(EmailService);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'localhost',
        port: 1025,
        secure: false,
      });
    });

    it('should handle undefined NODE_ENV as production', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config = {
                  NODE_ENV: undefined, // Undefined should use production behavior
                  SMTP_FROM_EMAIL: 'dev@wasplanning.nl',
                  SMTP_HOST: 'smtp.example.com',
                  SMTP_PORT: 587,
                  SMTP_SECURE: 'false',
                  SMTP_USER: 'test@example.com',
                  SMTP_PASSWORD: 'password',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password',
        },
      });
    });
  });

  describe('Production Configuration', () => {
    it('should configure SMTP for production environment', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config = {
                  NODE_ENV: 'production',
                  SMTP_HOST: 'smtp.sendgrid.net',
                  SMTP_PORT: 587,
                  SMTP_SECURE: 'false',
                  SMTP_USER: 'apikey',
                  SMTP_PASSWORD: 'SG.test-key',
                  SMTP_FROM_EMAIL: 'prod@wasplanning.nl',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: 'SG.test-key',
        },
      });
    });

    it('should handle secure SMTP configuration', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config = {
                  NODE_ENV: 'production',
                  SMTP_HOST: 'smtp.gmail.com',
                  SMTP_PORT: 465,
                  SMTP_SECURE: 'true', // SSL/TLS
                  SMTP_USER: 'user@gmail.com',
                  SMTP_PASSWORD: 'app-password',
                  SMTP_FROM_EMAIL: 'secure@wasplanning.nl',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'user@gmail.com',
          pass: 'app-password',
        },
      });
    });

    it('should use default port 587 when not specified', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config = {
                  NODE_ENV: 'production',
                  SMTP_HOST: 'smtp.example.com',
                  SMTP_PORT: undefined, // Should default to 587
                  SMTP_SECURE: 'false',
                  SMTP_USER: 'user@example.com',
                  SMTP_PASSWORD: 'password',
                  SMTP_FROM_EMAIL: 'noreply@wasplanning.nl',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587, // Default port
        secure: false,
        auth: {
          user: 'user@example.com',
          pass: 'password',
        },
      });
    });
  });

  describe('Staging Configuration', () => {
    it('should use production configuration for staging environment', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config = {
                  NODE_ENV: 'staging',
                  SMTP_HOST: 'smtp.staging.com',
                  SMTP_PORT: 587,
                  SMTP_SECURE: 'false',
                  SMTP_USER: 'staging@example.com',
                  SMTP_PASSWORD: 'staging-pass',
                  SMTP_FROM_EMAIL: 'staging@wasplanning.nl',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.staging.com',
        port: 587,
        secure: false,
        auth: {
          user: 'staging@example.com',
          pass: 'staging-pass',
        },
      });
    });
  });

  describe('Test Configuration', () => {
    it('should use production configuration for test environment', async () => {
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
                  SMTP_USER: 'test',
                  SMTP_PASSWORD: 'test',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);

      // Test environment should use production logic but with test SMTP settings
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'localhost',
        port: 1025,
        secure: false,
        auth: {
          user: 'test',
          pass: 'test',
        },
      });
    });
  });
});
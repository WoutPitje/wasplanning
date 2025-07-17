import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email.module';
import { EmailService } from './email.service';

describe('EmailModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        EmailModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide EmailService', () => {
    const emailService = module.get<EmailService>(EmailService);
    expect(emailService).toBeDefined();
    expect(emailService).toBeInstanceOf(EmailService);
  });

  it('should export EmailService', () => {
    const emailService = module.get<EmailService>(EmailService);
    expect(emailService).toBeDefined();
  });
});

import { EmailType } from '../enums/email-type.enum';

export class SendEmailDto {
  to: string;
  subject: string;
  template: EmailType;
  data: Record<string, any>;
  from?: string;
  replyTo?: string;
}
import { EmailType } from '../enums/email-type.enum';

export interface EmailJobData {
  to: string;
  subject: string;
  template: EmailType;
  data: Record<string, any>;
  from?: string;
  replyTo?: string;
  tenant_id?: string;
}

export interface EmailJobResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  response: string;
}

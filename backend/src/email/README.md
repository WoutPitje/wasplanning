# Email Module

## Overview
The Email module provides robust email functionality for the Wasplanning system. It handles transactional emails, user notifications, and template-based messaging with multi-tenant support and environment-specific configuration.

## Features
- Template-based email rendering with Handlebars
- Multi-environment support (development with MailHog, production with SMTP)
- Email validation and error handling
- Configurable email templates
- Tenant-specific email functionality
- Comprehensive logging and monitoring
- Fallback email configuration

## Email Types
1. **USER_WELCOME** - Welcome emails for new users with temporary passwords
2. **PASSWORD_RESET** - Password reset confirmation emails
3. **ACCOUNT_ACTIVATION** - Account activation notifications

## API Integration

### EmailService Methods

#### sendEmail(emailData: EmailJobData)
- Sends emails using configured transporter
- Validates email addresses
- Renders templates with provided data
- Returns delivery results

#### sendWelcomeEmail(email: string, userData: object)
- Specialized method for user welcome emails
- Includes temporary password if generated
- Uses tenant-specific branding

## Configuration

### Development Environment
- Uses MailHog for local email testing
- Host: localhost:1025
- No authentication required
- All emails captured locally for development

### Production Environment
- Configurable SMTP settings
- Secure authentication
- TLS/SSL support
- Production email delivery

## Environment Variables
```env
# SMTP Configuration (Production)
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=noreply@wasplanning.nl

# Development
NODE_ENV=development  # Uses MailHog when set to 'development'
```

## Email Templates

### Template Location
Templates are located in `/src/email/templates/` with `.hbs` extension:
- `user_welcome.hbs` - New user welcome email
- `password_reset.hbs` - Password reset email
- `account_activation.hbs` - Account activation email

### Template Resolution
The service searches for templates in multiple locations:
1. Compiled dist location (production)
2. Source location (development)
3. Monorepo source location (development)

### Template Data Structure
```typescript
interface TemplateData {
  firstName: string;
  lastName: string;
  tenantName: string;
  temporaryPassword?: string;
  to: string;
  [key: string]: any;
}
```

## Interfaces

### EmailJobData
```typescript
{
  to: string;           // Recipient email address
  subject: string;      // Email subject line
  template: EmailType;  // Template to use
  data: Record<string, any>; // Template variables
  from?: string;        // Sender email (optional)
  replyTo?: string;     // Reply-to address (optional)
  tenant_id?: string;   // Tenant context (optional)
}
```

### EmailJobResult
```typescript
{
  messageId: string;    // Unique message identifier
  accepted: string[];   // Successfully accepted recipients
  rejected: string[];   // Rejected recipients
  response: string;     // SMTP server response
}
```

## Usage Examples

### Basic Email Sending
```typescript
import { EmailService } from '../email/email.service';
import { EmailType } from '../email/enums/email-type.enum';

@Injectable()
export class UserService {
  constructor(private emailService: EmailService) {}

  async createUser(userData: CreateUserDto) {
    // Create user logic...
    
    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      userData.email,
      {
        firstName: userData.first_name,
        lastName: userData.last_name,
        temporaryPassword: generatedPassword,
        tenantName: tenant.display_name,
      }
    );
  }
}
```

### Custom Email Template
```typescript
const emailData = {
  to: 'user@example.com',
  subject: 'Custom Notification',
  template: EmailType.CUSTOM_NOTIFICATION,
  data: {
    userName: 'John Doe',
    message: 'Your wash request has been completed',
    tenantName: 'Garage ABC',
  },
};

await this.emailService.sendEmail(emailData);
```

## Error Handling
- Invalid email addresses are validated before sending
- Template rendering errors are caught and logged
- SMTP errors are logged with detailed information
- Fallback email addresses used when configuration is invalid
- Comprehensive error messages for debugging

## Security Considerations
- Email addresses validated using regex pattern
- SMTP credentials stored in environment variables
- No sensitive data logged in email content
- Template injection protection via Handlebars
- Configurable sender validation

## Testing

### Unit Tests
- Email service functionality
- Template rendering
- Email validation
- Error handling scenarios
- Configuration testing

### Development Testing
```bash
# Start MailHog for local email testing
docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Access MailHog web interface
http://localhost:8025
```

### E2E Testing
- Full email sending workflow
- Template integration testing
- Multi-environment configuration
- SMTP connection testing

## Monitoring and Logging
- All email operations logged with appropriate levels
- Failed deliveries logged with error details
- Template rendering performance tracked
- SMTP connection status monitored
- Email delivery statistics available

## Integration with Other Modules
- **Auth Module**: Welcome emails for new users
- **Users Module**: Password reset and account notifications
- **Admin Module**: Tenant-specific email configuration
- **Audit Module**: Email operation logging

## Future Enhancements
- Email queue implementation for high-volume sending
- Additional template types for business notifications
- Email analytics and delivery tracking
- Advanced template features (attachments, inline images)
- Webhook support for delivery confirmations
import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { Request } from 'express';
import { WebhookService } from '../services/webhook.service';
import { RateLimit } from '../decorators/rate-limit.decorator';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ points: 100, duration: 60 }) // 100 requests per minute
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiExcludeEndpoint() // Hide from public API docs
  async handleStripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      this.logger.warn('Webhook request received without signature');
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!request.rawBody) {
      this.logger.error('Webhook request received without raw body');
      throw new BadRequestException(
        'Raw body is required for webhook processing',
      );
    }

    try {
      // Process webhook asynchronously
      await this.webhookService.handleStripeWebhook(
        request.rawBody,
        signature,
        request.ip || 'unknown',
      );

      // Return 200 immediately
      return { received: true };
    } catch (error) {
      this.logger.error('Failed to process webhook', error);

      // Log suspicious activity
      if (error.message.includes('signature')) {
        this.logger.warn(`Invalid webhook signature from IP: ${request.ip}`);
        await this.webhookService.logSuspiciousActivity(
          request.ip || 'unknown',
          'invalid_signature',
          {
            error: error.message,
            headers: request.headers,
          },
        );
      }

      throw new BadRequestException('Webhook processing failed');
    }
  }
}

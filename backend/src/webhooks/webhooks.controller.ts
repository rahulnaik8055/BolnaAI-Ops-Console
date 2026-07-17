import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('webhooks/bolna')
  @HttpCode(200)
  async handleWebhook(@Body() payload: any) {
    console.log('Received webhook payload:', payload);
    return this.webhooksService.handleWebhook(payload);
  }
}

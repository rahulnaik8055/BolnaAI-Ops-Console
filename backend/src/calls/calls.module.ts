import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { CallsStoreModule } from './calls-store.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [CallsStoreModule, WebhooksModule],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}

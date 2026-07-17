import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { LatencyStatsService } from './latency-stats.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebSocketModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, LatencyStatsService],
  exports: [LatencyStatsService],
})
export class WebhooksModule {}

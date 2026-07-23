import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CallsStoreModule } from './calls/calls-store.module';
import { WebSocketModule } from './websocket/websocket.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CallsModule } from './calls/calls.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CallsStoreModule,
    WebSocketModule,
    WebhooksModule,
    CallsModule,
  ],
})
export class AppModule {}

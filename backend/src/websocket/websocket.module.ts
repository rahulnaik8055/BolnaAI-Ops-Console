import { Module } from '@nestjs/common';
import { CallsGateway } from './calls.gateway';

@Module({
  providers: [CallsGateway],
  exports: [CallsGateway],
})
export class WebSocketModule {}

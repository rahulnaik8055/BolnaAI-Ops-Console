import { Module } from '@nestjs/common';
import { CallsStoreService } from './calls-store.service';

@Module({
  providers: [CallsStoreService],
  exports: [CallsStoreService],
})
export class CallsStoreModule {}

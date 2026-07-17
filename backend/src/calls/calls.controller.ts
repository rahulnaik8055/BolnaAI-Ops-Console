import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CallsService } from './calls.service';
import { LatencyStatsService } from '../webhooks/latency-stats.service';

@Controller('calls')
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
    private readonly latencyStats: LatencyStatsService,
  ) {}

  @Post('trigger')
  async triggerCall(
    @Body() body: { agentId: string; recipientPhoneNumber: string },
  ) {
    return this.callsService.triggerCall(body.agentId, body.recipientPhoneNumber);
  }

  @Get()
  async listCalls() {
    return this.callsService.listRecentCalls();
  }

  @Get('stats')
  async getStats() {
    return this.callsService.getStats();
  }

  @Get('anomalies')
  async getAnomalies() {
    return this.latencyStats.getRecentAnomalies();
  }

  @Get('latency-stats')
  async getLatencyStats() {
    return this.latencyStats.computeBaseline(true);
  }

  @Get('cost-audit')
  async getCostAudit() {
    return this.callsService.getCostAudit();
  }

  @Get('webhook-log/:id')
  async getWebhookLog(@Param('id') id: string) {
    return this.callsService.getWebhookLog(id);
  }
}

import { Injectable } from '@nestjs/common';
import { CallsStoreService, CallExecution } from '../calls/calls-store.service';
import { CallsGateway } from '../websocket/calls.gateway';
import { LatencyStatsService } from './latency-stats.service';

const VALID_STATUSES = new Set([
  'queued',
  'initiated',
  'ringing',
  'in-progress',
  'call-disconnected',
  'completed',
  'no-answer',
  'busy',
  'failed',
  'canceled',
  'stopped',
  'error',
  'balance-low',
]);

@Injectable()
export class WebhooksService {
  constructor(
    private store: CallsStoreService,
    private gateway: CallsGateway,
    private latencyStats: LatencyStatsService,
  ) {}

  async handleWebhook(payload: any) {
    const p = payload;
    const status = p.status;

    // ──────────────────────────────────────────────────────────────────
    // COMPREHENSIVE COST LOGGING
    // ──────────────────────────────────────────────────────────────────
    console.log(
      `[COST-AUDIT] ─── Webhook Received ───\n` +
      `  id              = ${p.id}\n` +
      `  status          = ${p.status}\n` +
      `  billing_settled = ${JSON.stringify(p.billing_settled)}\n` +
      `  total_cost      = ${JSON.stringify(p.total_cost)} (typeof=${typeof p.total_cost})\n` +
      `  cost_breakdown  = ${JSON.stringify(p.cost_breakdown)}\n` +
      `  ───────────────────────────────────────`,
    );

    // ──────────────────────────────────────────────────────────────────
    // UPSERT FIRST: parent must exist before we append the event.
    // ──────────────────────────────────────────────────────────────────
    const saved = this.store.upsertCall({
      id: p.id,
      agentId: p.agent_id,
      batchId: p.batch_id ?? null,
      campaignId: p.campaign_id ?? null,
      status,
      smartStatus: p.smart_status ?? null,
      provider: p.provider ?? null,
      scheduledAt: p.scheduled_at ?? null,
      initiatedAt: p.initiated_at ?? null,
      answeredByVoicemail: p.answered_by_voice_mail ?? null,
      conversationDuration: p.conversation_duration ?? null,
      errorMessage: p.error_message ?? null,
      billingSettled: p.billing_settled ?? null,
      processingStatus: p.processing_status ?? null,
      userNumber: p.user_number ?? null,
      agentNumber: p.agent_number ?? null,
      transcript: p.transcript ?? null,
      summary: p.summary ?? null,
      totalCost: typeof p.total_cost === 'number' ? p.total_cost : null,
      llmCost: typeof p.cost_breakdown?.llm === 'number' ? p.cost_breakdown.llm : null,
      networkCost: typeof p.cost_breakdown?.network === 'number' ? p.cost_breakdown.network : null,
      platformCost: typeof p.cost_breakdown?.platform === 'number' ? p.cost_breakdown.platform : null,
      synthesizerCost: typeof p.cost_breakdown?.synthesizer === 'number' ? p.cost_breakdown.synthesizer : null,
      transcriberCost: typeof p.cost_breakdown?.transcriber === 'number' ? p.cost_breakdown.transcriber : null,
      priceBreakdown: p.price_breakdown ? JSON.stringify(p.price_breakdown) : null,
      timeToFirstAudio: p.latency_data?.time_to_first_audio ?? null,
      streamId: p.latency_data?.stream_id ?? null,
      latencyRegion: p.latency_data?.region ?? null,
      recordingUrl: p.telephony_data?.recording_url ?? null,
      toNumber: p.telephony_data?.to_number ?? null,
      fromNumber: p.telephony_data?.from_number ?? null,
      callType: p.telephony_data?.call_type ?? null,
      hangupBy: p.telephony_data?.hangup_by ?? null,
      hangupReason: p.telephony_data?.hangup_reason ?? null,
      hangupProviderCode: p.telephony_data?.hangup_provider_code ?? null,
      providerCallId: p.telephony_data?.provider_call_id ?? null,
      hostedTelephony: p.telephony_data?.hosted_telephony ?? null,
      retryCount: p.retry_count ?? null,
      usageBreakdown: p.usage_breakdown ?? null,
      costBreakdown: p.cost_breakdown ?? null,
      latencyData: p.latency_data ?? null,
      extractedData: p.extracted_data ?? null,
      rawPayload: payload,
    });

    // ──────────────────────────────────────────────────────────────────
    // APPEND-ONLY: every version of the webhook for this execution.
    // ──────────────────────────────────────────────────────────────────
    const eventCount = this.store.appendWebhookEvent({
      executionId: p.id,
      status: p.status ?? null,
      billingSettled: p.billing_settled ?? null,
      totalCost: typeof p.total_cost === 'number' ? p.total_cost : null,
      costBreakdown: p.cost_breakdown ?? null,
      priceBreakdown: p.price_breakdown ?? null,
      rawPayload: payload,
    });

    console.log(
      `[COST-AUDIT] ─── After Upsert (event #${eventCount}) ───\n` +
      `  id            = ${saved.id}\n` +
      `  status        = ${saved.status}\n` +
      `  billingSettled= ${saved.billingSettled}\n` +
      `  totalCost     = ${saved.totalCost}\n` +
      `  llmCost       = ${saved.llmCost}\n` +
      `  synthCost     = ${saved.synthesizerCost}\n` +
      `  sttCost       = ${saved.transcriberCost}\n` +
      `  platformCost  = ${saved.platformCost}\n` +
      `  networkCost   = ${saved.networkCost}\n` +
      `  ───────────────────────────────────────`,
    );

    this.gateway.broadcastCallUpdate(saved);

    const anomalies = await this.latencyStats.detectAnomalies(saved);
    if (anomalies.length > 0) {
      this.latencyStats.bufferAnomaly({ callId: saved.id, anomalies });
      this.gateway.broadcastAnomaly(saved, anomalies);
    }

    if (status === 'completed') {
      const stats = this.getStats();
      this.gateway.broadcastStatsUpdate(stats);
    }

    return saved;
  }

  getStats() {
    const calls = this.store.getAll().filter((c) => c.totalCost != null);

    const callCount = calls.length;
    const totalSpend = calls.reduce((sum, c) => sum + (c.totalCost ?? 0), 0);
    const avgCostPerCall = callCount > 0 ? totalSpend / callCount : 0;

    const costByComponent = {
      llm: calls.reduce((sum, c) => sum + (c.llmCost ?? 0), 0),
      synthesizer: calls.reduce((sum, c) => sum + (c.synthesizerCost ?? 0), 0),
      transcriber: calls.reduce((sum, c) => sum + (c.transcriberCost ?? 0), 0),
      platform: calls.reduce((sum, c) => sum + (c.platformCost ?? 0), 0),
      network: calls.reduce((sum, c) => sum + (c.networkCost ?? 0), 0),
    };

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();
    const todayCalls = calls.filter((c) => c.createdAt >= todayMs).length;
    const estimatedCallsPerMonth = todayCalls > 0 ? todayCalls * 30 : callCount;
    const projectedMonthlyBurn = avgCostPerCall * estimatedCallsPerMonth;

    return {
      totalSpend,
      callCount,
      avgCostPerCall,
      costByComponent,
      projectedMonthlyBurn,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CallsGateway } from '../websocket/calls.gateway';
import { LatencyStatsService } from './latency-stats.service';

const VALID_STATUSES = [
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
];

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private gateway: CallsGateway,
    private latencyStats: LatencyStatsService,
  ) {}

  async handleWebhook(payload: any) {
    const p = payload;

    const status = VALID_STATUSES.includes(p.status) ? p.status : p.status;

    console.log(`[COST-AUDIT] Webhook id=${p.id} status=${p.status} total_cost=${JSON.stringify(p.total_cost)} (typeof=${typeof p.total_cost}) cost_breakdown=${JSON.stringify(p.cost_breakdown)}`);

    const data = {
      id: p.id,
      agentId: p.agent_id,
      batchId: p.batch_id ?? null,
      campaignId: p.campaign_id ?? null,
      status,
      smartStatus: p.smart_status ?? null,
      provider: p.provider ?? null,

      scheduledAt: p.scheduled_at ? new Date(p.scheduled_at) : null,
      initiatedAt: p.initiated_at ? new Date(p.initiated_at) : null,
      createdAtStr: p.created_at_str ?? null,
      updatedAtStr: p.updated_at_str ?? null,

      answeredByVoicemail: p.answered_by_voice_mail ?? null,
      conversationDuration: p.conversation_duration ?? null,
      errorMessage: p.error_message ?? null,
      billingSettled: p.billing_settled ?? null,
      processingStatus: p.processing_status ?? null,

      userNumber: p.user_number ?? null,
      agentNumber: p.agent_number ?? null,

      transcript: p.transcript ?? null,
      summary: p.summary ?? null,

      totalCost: p.total_cost ?? null,
      llmCost: p.cost_breakdown?.llm ?? null,
      networkCost: p.cost_breakdown?.network ?? null,
      platformCost: p.cost_breakdown?.platform ?? null,
      synthesizerCost: p.cost_breakdown?.synthesizer ?? null,
      transcriberCost: p.cost_breakdown?.transcriber ?? null,

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

      usageBreakdown: p.usage_breakdown
        ? JSON.stringify(p.usage_breakdown)
        : null,
      costBreakdown: p.cost_breakdown
        ? JSON.stringify(p.cost_breakdown)
        : null,
      latencyData: p.latency_data ? JSON.stringify(p.latency_data) : null,
      extractedData: p.extracted_data
        ? JSON.stringify(p.extracted_data)
        : null,
      customExtractions: p.custom_extractions
        ? JSON.stringify(p.custom_extractions)
        : null,
      contextDetails: p.context_details
        ? JSON.stringify(p.context_details)
        : null,
      telephonyDataRaw: p.telephony_data
        ? JSON.stringify(p.telephony_data)
        : null,
      transferCallData: p.transfer_call_data
        ? JSON.stringify(p.transfer_call_data)
        : null,
      retryHistory: p.retry_history
        ? JSON.stringify(p.retry_history)
        : null,
      postProcessingPhases: p.post_processing_phases
        ? JSON.stringify(p.post_processing_phases)
        : null,
      batchRunDetails: p.batch_run_details
        ? JSON.stringify(p.batch_run_details)
        : null,
      agentContextDetails: p.agent_context_details
        ? JSON.stringify(p.agent_context_details)
        : null,
      agentExtraction: p.agent_extraction
        ? JSON.stringify(p.agent_extraction)
        : null,

      rawPayload: JSON.stringify(payload),
    };

    const saved = await this.prisma.callExecution.upsert({
      where: { id: p.id },
      create: data,
      update: data,
    });

    console.log(`[COST-AUDIT] Stored id=${saved.id} totalCost=${saved.totalCost} llmCost=${saved.llmCost} synthCost=${saved.synthesizerCost} sttCost=${saved.transcriberCost} platformCost=${saved.platformCost} networkCost=${saved.networkCost}`);
    if (saved.rawPayload) {
      try {
        const raw = JSON.parse(saved.rawPayload);
        console.log(`[COST-AUDIT] Re-read rawPayload total_cost=${raw.total_cost} (typeof=${typeof raw.total_cost}) cost_breakdown=${JSON.stringify(raw.cost_breakdown)}`);
      } catch {}
    }

    this.gateway.broadcastCallUpdate(saved);

    // Anomaly detection — computed on the fly, not persisted to DB.
    // Tradeoff: anomalies are ephemeral (lost on restart) but avoid schema churn.
    // For a production system you'd add an `anomalyFlags String?` column via migration.
    const anomalies = await this.latencyStats.detectAnomalies(saved);
    if (anomalies.length > 0) {
      this.latencyStats.bufferAnomaly({ callId: saved.id, anomalies });
      this.gateway.broadcastAnomaly(saved, anomalies);
    }

    if (status === 'completed') {
      const stats = await this.getStats();
      this.gateway.broadcastStatsUpdate(stats);
    }

    return saved;
  }

  private async getStats() {
    const calls = await this.prisma.callExecution.findMany({
      where: { totalCost: { not: null } },
    });

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

    // Simple extrapolation: estimate calls/month as 30 × current daily call count.
    // This is a placeholder — a real forecast would use trend data and time windows.
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayCalls = calls.filter(
      (c) => c.createdAt >= todayStart,
    ).length;
    const estimatedCallsPerMonth = todayCalls > 0 ? todayCalls * 30 : callCount;
    const projectedMonthlyBurn = avgCostPerCall * estimatedCallsPerMonth;

    console.log(`[COST-AUDIT] Stats totalSpend=${totalSpend} callCount=${callCount} avgCostPerCall=${avgCostPerCall} components=${JSON.stringify(costByComponent)}`);

    return {
      totalSpend,
      callCount,
      avgCostPerCall,
      costByComponent,
      projectedMonthlyBurn,
    };
  }
}

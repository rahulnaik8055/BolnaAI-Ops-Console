import { Injectable, HttpException } from '@nestjs/common';
import { CallsStoreService } from './calls-store.service';
import axios from 'axios';

@Injectable()
export class CallsService {
  constructor(private store: CallsStoreService) {}

  async triggerCall(agentId: string, recipientPhoneNumber: string) {
    const apiKey = process.env.BOLNA_API_KEY;
    if (!apiKey) {
      throw new HttpException('BOLNA_API_KEY not configured', 500);
    }

    try {
      const response = await axios.post(
        'https://api.bolna.ai/call',
        {
          agent_id: agentId,
          recipient_phone_number: recipientPhoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          error.response?.data || error.message,
          error.response?.status || 500,
        );
      }
      throw error;
    }
  }

  listRecentCalls() {
    return this.store.listRecent(50);
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

  getCostAudit() {
    const calls = this.store.listRecent(20);

    return calls.map((c) => {
      const rawPayload = c.rawPayload;
      const rawTotalCost = rawPayload?.total_cost ?? null;
      const rawCostBreakdownFromPayload = rawPayload?.cost_breakdown ?? null;

      const components =
        c.llmCost != null || c.synthesizerCost != null || c.transcriberCost != null || c.platformCost != null || c.networkCost != null
          ? (c.llmCost ?? 0) + (c.synthesizerCost ?? 0) + (c.transcriberCost ?? 0) + (c.platformCost ?? 0) + (c.networkCost ?? 0)
          : null;

      const events = this.store.getWebhookEvents(c.id);
      const webhookEventSummaries = events.map((e) => {
        const eventPayload = e.rawPayload;
        return {
          receivedAt: new Date(e.receivedAt).toISOString(),
          status: e.status,
          billingSettled: e.billingSettled,
          totalCost: e.totalCost,
          costBreakdown: e.costBreakdown,
          priceBreakdown: e.priceBreakdown,
          rawTotalCost: eventPayload?.total_cost ?? null,
          rawCostBreakdown: eventPayload?.cost_breakdown ?? null,
        };
      });

      return {
        id: c.id,
        status: c.status,
        createdAt: new Date(c.createdAt).toISOString(),
        billingSettled: c.billingSettled,
        webhookEventCount: events.length,
        rawFromLatestPayload: {
          totalCost: rawTotalCost,
          costBreakdown: rawCostBreakdownFromPayload,
        },
        storedInDb: {
          totalCost: c.totalCost,
          llmCost: c.llmCost,
          synthesizerCost: c.synthesizerCost,
          transcriberCost: c.transcriberCost,
          platformCost: c.platformCost,
          networkCost: c.networkCost,
          costBreakdownJson: c.costBreakdown,
        },
        computed: {
          sumOfComponents: components,
          matchesStoredTotal: c.totalCost != null && components != null ? Math.abs(c.totalCost - components) < 0.001 : null,
        },
        eventHistory: webhookEventSummaries,
      };
    });
  }

  getWebhookLog(executionId: string) {
    const events = this.store.getWebhookEvents(executionId);

    return events.map((e) => {
      const payload = e.rawPayload;
      return {
        receivedAt: new Date(e.receivedAt).toISOString(),
        status: e.status,
        billingSettled: e.billingSettled,
        totalCost: e.totalCost,
        costBreakdown: e.costBreakdown,
        priceBreakdown: e.priceBreakdown,
        rawTotalCost: payload?.total_cost ?? null,
        rawCostBreakdown: payload?.cost_breakdown ?? null,
        rawBillingSettled: payload?.billing_settled ?? null,
        rawPayload: payload,
      };
    });
  }
}

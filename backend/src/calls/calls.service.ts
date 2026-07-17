import { Injectable, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class CallsService {
  constructor(private prisma: PrismaService) {}

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

  async listRecentCalls() {
    return this.prisma.callExecution.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getStats() {
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

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayCalls = calls.filter(
      (c) => c.createdAt >= todayStart,
    ).length;
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

  async getCostAudit() {
    const calls = await this.prisma.callExecution.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { webhookEvents: { orderBy: { receivedAt: 'asc' } } },
    });

    return calls.map((c) => {
      let rawCostBreakdown: any = null;
      let rawTotalCost: any = null;
      let rawCostBreakdownFromPayload: any = null;
      let rawPriceBreakdown: any = null;

      if (c.rawPayload) {
        try {
          const raw = JSON.parse(c.rawPayload);
          rawTotalCost = raw.total_cost;
          rawCostBreakdownFromPayload = raw.cost_breakdown;
          rawPriceBreakdown = raw.price_breakdown;
        } catch {}
      }
      if (c.costBreakdown) {
        try {
          rawCostBreakdown = JSON.parse(c.costBreakdown);
        } catch {}
      }

      let storedPriceBreakdown: any = null;
      if (c.priceBreakdown) {
        try {
          storedPriceBreakdown = JSON.parse(c.priceBreakdown);
        } catch {}
      }

      const components =
        c.llmCost != null || c.synthesizerCost != null || c.transcriberCost != null || c.platformCost != null || c.networkCost != null
          ? (c.llmCost ?? 0) + (c.synthesizerCost ?? 0) + (c.transcriberCost ?? 0) + (c.platformCost ?? 0) + (c.networkCost ?? 0)
          : null;

      const webhookEventSummaries = c.webhookEvents.map((e) => {
        let eventCostBreakdown: any = null;
        let eventPriceBreakdown: any = null;
        let eventPayload: any = null;
        try {
          eventCostBreakdown = e.costBreakdown ? JSON.parse(e.costBreakdown) : null;
        } catch {}
        try {
          eventPriceBreakdown = e.priceBreakdown ? JSON.parse(e.priceBreakdown) : null;
        } catch {}
        try {
          eventPayload = JSON.parse(e.rawPayload);
        } catch {}

        return {
          receivedAt: e.receivedAt,
          status: e.status,
          billingSettled: e.billingSettled,
          totalCost: e.totalCost,
          costBreakdown: eventCostBreakdown,
          priceBreakdown: eventPriceBreakdown,
          rawTotalCost: eventPayload?.total_cost ?? null,
          rawPriceBreakdown: eventPayload?.price_breakdown ?? null,
          rawCostBreakdown: eventPayload?.cost_breakdown ?? null,
        };
      });

      return {
        id: c.id,
        status: c.status,
        createdAt: c.createdAt,
        billingSettled: c.billingSettled,
        webhookEventCount: c.webhookEvents.length,
        rawFromLatestPayload: {
          totalCost: rawTotalCost,
          costBreakdown: rawCostBreakdownFromPayload,
          priceBreakdown: rawPriceBreakdown,
        },
        storedInDb: {
          totalCost: c.totalCost,
          llmCost: c.llmCost,
          synthesizerCost: c.synthesizerCost,
          transcriberCost: c.transcriberCost,
          platformCost: c.platformCost,
          networkCost: c.networkCost,
          costBreakdownJson: rawCostBreakdown,
          priceBreakdown: storedPriceBreakdown,
        },
        computed: {
          sumOfComponents: components,
          matchesStoredTotal: c.totalCost != null && components != null ? Math.abs(c.totalCost - components) < 0.001 : null,
        },
        eventHistory: webhookEventSummaries,
      };
    });
  }

  async getWebhookLog(executionId: string) {
    const events = await this.prisma.webhookEvent.findMany({
      where: { executionId },
      orderBy: { receivedAt: 'asc' },
    });

    return events.map((e) => {
      let payload: any = null;
      let costBreakdown: any = null;
      let priceBreakdown: any = null;
      try {
        payload = JSON.parse(e.rawPayload);
        costBreakdown = e.costBreakdown ? JSON.parse(e.costBreakdown) : null;
        priceBreakdown = e.priceBreakdown ? JSON.parse(e.priceBreakdown) : null;
      } catch {}

      return {
        receivedAt: e.receivedAt,
        status: e.status,
        billingSettled: e.billingSettled,
        totalCost: e.totalCost,
        costBreakdown,
        priceBreakdown,
        rawTotalCost: payload?.total_cost ?? null,
        rawPriceBreakdown: payload?.price_breakdown ?? null,
        rawCostBreakdown: payload?.cost_breakdown ?? null,
        rawBillingSettled: payload?.billing_settled ?? null,
        rawPayload: payload,
      };
    });
  }
}

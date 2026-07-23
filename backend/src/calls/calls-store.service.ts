import { Injectable, OnModuleDestroy } from '@nestjs/common';

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes
const DEFAULT_TTL_HOURS = 72;

export interface CallExecution {
  id: string;
  agentId: string;
  batchId: string | null;
  campaignId: string | null;
  status: string;
  smartStatus: string | null;
  provider: string | null;
  scheduledAt: string | null;
  initiatedAt: string | null;
  answeredByVoicemail: boolean | null;
  conversationDuration: number | null;
  errorMessage: string | null;
  billingSettled: boolean | null;
  processingStatus: string | null;
  userNumber: string | null;
  agentNumber: string | null;
  transcript: string | null;
  summary: string | null;
  totalCost: number | null;
  llmCost: number | null;
  networkCost: number | null;
  platformCost: number | null;
  synthesizerCost: number | null;
  transcriberCost: number | null;
  priceBreakdown: string | null;
  timeToFirstAudio: number | null;
  streamId: number | null;
  latencyRegion: string | null;
  recordingUrl: string | null;
  toNumber: string | null;
  fromNumber: string | null;
  callType: string | null;
  hangupBy: string | null;
  hangupReason: string | null;
  hangupProviderCode: number | null;
  providerCallId: string | null;
  hostedTelephony: boolean | null;
  retryCount: number | null;
  usageBreakdown: any;
  costBreakdown: any;
  latencyData: any;
  extractedData: any;
  rawPayload: any;
  createdAt: number;
  updatedAt: number;
}

export interface WebhookEvent {
  executionId: string;
  status: string | null;
  totalCost: number | null;
  billingSettled: boolean | null;
  costBreakdown: any;
  priceBreakdown: any;
  rawPayload: any;
  receivedAt: number;
}

@Injectable()
export class CallsStoreService implements OnModuleDestroy {
  private calls = new Map<string, CallExecution>();
  private webhookEvents = new Map<string, WebhookEvent[]>();
  private cleanupTimer: ReturnType<typeof setInterval>;
  private ttlMs: number;

  constructor() {
    const ttlHours = Number(process.env.DATA_TTL_HOURS) || DEFAULT_TTL_HOURS;
    this.ttlMs = ttlHours * 60 * 60 * 1000;

    console.log(`[TTL-STORE] CallsStore initialized, TTL=${ttlHours}h (${this.ttlMs}ms)`);

    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  upsertCall(data: Omit<CallExecution, 'createdAt' | 'updatedAt'>): CallExecution {
    const existing = this.calls.get(data.id);
    const now = Date.now();

    const record: CallExecution = {
      ...data,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.calls.set(data.id, record);
    return record;
  }

  appendWebhookEvent(event: Omit<WebhookEvent, 'receivedAt'>): number {
    const existing = this.webhookEvents.get(event.executionId) ?? [];
    const entry: WebhookEvent = { ...event, receivedAt: Date.now() };
    existing.push(entry);
    this.webhookEvents.set(event.executionId, existing);
    return existing.length;
  }

  getWebhookEvents(executionId: string): WebhookEvent[] {
    return this.webhookEvents.get(executionId) ?? [];
  }

  listRecent(limit = 50): CallExecution[] {
    return Array.from(this.calls.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  getAll(): CallExecution[] {
    return Array.from(this.calls.values());
  }

  get(id: string): CallExecution | undefined {
    return this.calls.get(id);
  }

  private cleanup() {
    const cutoff = Date.now() - this.ttlMs;
    let evictedCalls = 0;
    let evictedEvents = 0;

    for (const [id, call] of this.calls) {
      if (call.createdAt < cutoff) {
        this.calls.delete(id);
        const events = this.webhookEvents.get(id);
        if (events) {
          evictedEvents += events.length;
          this.webhookEvents.delete(id);
        }
        evictedCalls++;
      }
    }

    if (evictedCalls > 0) {
      console.log(`[TTL-CLEANUP] evicted ${evictedCalls} calls, ${evictedEvents} webhook events`);
    }
  }
}

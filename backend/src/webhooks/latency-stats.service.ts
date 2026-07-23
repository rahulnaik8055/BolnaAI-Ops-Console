import { Injectable } from '@nestjs/common';
import { CallsStoreService, CallExecution } from '../calls/calls-store.service';

// ── Tunable thresholds ──────────────────────────────────────────────
// HIGH_LATENCY: flagged when timeToFirstAudio > p95 of recent calls.
// COST_OUTLIER: flagged when totalCost > meanCost + COST_STDDEV_MULTIPLIER * stdDevCost.
// FAILED_HANGUP: flagged whenever status is a terminal failure state.
const MIN_BASELINE_SAMPLES = 20;
const BASELINE_WINDOW = 100;
const COST_STDDEV_MULTIPLIER = 2;
const RECOMPUTE_EVERY = 20;

const FAILED_STATUSES = new Set([
  'no-answer',
  'busy',
  'failed',
  'canceled',
  'stopped',
  'error',
  'balance-low',
]);

export interface LatencyBaseline {
  p50TimeToFirstAudio: number | null;
  p95TimeToFirstAudio: number | null;
  meanCost: number;
  stdDevCost: number;
  sampleSize: number;
}

export interface AnomalyResult {
  callId: string;
  anomalies: string[];
}

@Injectable()
export class LatencyStatsService {
  private cachedBaseline: LatencyBaseline | null = null;
  private webhookCount = 0;

  private readonly ANOMALY_BUFFER_SIZE = 50;
  private anomalyBuffer: AnomalyResult[] = [];

  constructor(private store: CallsStoreService) {}

  async computeBaseline(forceRefresh = false): Promise<LatencyBaseline> {
    this.webhookCount++;
    if (!forceRefresh && this.cachedBaseline && this.webhookCount % RECOMPUTE_EVERY !== 0) {
      return this.cachedBaseline;
    }

    const calls = this.store.getAll()
      .filter((c) => c.timeToFirstAudio != null)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, BASELINE_WINDOW);

    const latencies = calls
      .map((c) => c.timeToFirstAudio!)
      .sort((a, b) => a - b);
    const costs = calls
      .map((c) => c.totalCost ?? 0);

    const p50 = percentile(latencies, 50);
    const p95 = percentile(latencies, 95);
    const meanCost = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
    const stdDevCost = costs.length > 1 ? Math.sqrt(
      costs.reduce((sum, c) => sum + (c - meanCost) ** 2, 0) / (costs.length - 1),
    ) : 0;

    this.cachedBaseline = {
      p50TimeToFirstAudio: p50,
      p95TimeToFirstAudio: p95,
      meanCost,
      stdDevCost,
      sampleSize: calls.length,
    };

    return this.cachedBaseline;
  }

  async detectAnomalies(call: CallExecution): Promise<string[]> {
    const baseline = await this.computeBaseline();
    const anomalies: string[] = [];

    if (
      call.timeToFirstAudio != null &&
      baseline.sampleSize >= MIN_BASELINE_SAMPLES &&
      baseline.p95TimeToFirstAudio != null &&
      call.timeToFirstAudio > baseline.p95TimeToFirstAudio
    ) {
      anomalies.push(
        `HIGH_LATENCY: ${Math.round(call.timeToFirstAudio)}ms > p95 ${Math.round(baseline.p95TimeToFirstAudio)}ms`,
      );
    }

    if (
      call.totalCost != null &&
      baseline.sampleSize >= 2 &&
      baseline.stdDevCost > 0 &&
      call.totalCost > baseline.meanCost + COST_STDDEV_MULTIPLIER * baseline.stdDevCost
    ) {
      anomalies.push(
        `COST_OUTLIER: $${call.totalCost.toFixed(2)} > threshold $${(baseline.meanCost + COST_STDDEV_MULTIPLIER * baseline.stdDevCost).toFixed(2)}`,
      );
    }

    if (FAILED_STATUSES.has(call.status)) {
      anomalies.push(`FAILED_HANGUP: status=${call.status}`);
    }

    return anomalies;
  }

  bufferAnomaly(anomaly: AnomalyResult): void {
    this.anomalyBuffer.unshift(anomaly);
    if (this.anomalyBuffer.length > this.ANOMALY_BUFFER_SIZE) {
      this.anomalyBuffer = this.anomalyBuffer.slice(0, this.ANOMALY_BUFFER_SIZE);
    }
  }

  getRecentAnomalies(): AnomalyResult[] {
    return this.anomalyBuffer;
  }
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const frac = idx - lower;
  return sorted[lower] * (1 - frac) + sorted[upper] * frac;
}

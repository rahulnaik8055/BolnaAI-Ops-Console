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
  createdAtStr: string | null;
  updatedAtStr: string | null;
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
  usageBreakdown: string | null;
  costBreakdown: string | null;
  latencyData: string | null;
  extractedData: string | null;
  customExtractions: string | null;
  contextDetails: string | null;
  telephonyDataRaw: string | null;
  transferCallData: string | null;
  retryHistory: string | null;
  postProcessingPhases: string | null;
  batchRunDetails: string | null;
  agentContextDetails: string | null;
  agentExtraction: string | null;
  rawPayload: string;
  updatedAt: string;
  createdAt: string;
}

export interface CallStats {
  totalSpend: number;
  callCount: number;
  avgCostPerCall: number;
  costByComponent: {
    llm: number;
    synthesizer: number;
    transcriber: number;
    platform: number;
    network: number;
  };
  projectedMonthlyBurn: number;
}

export interface LatencyBaseline {
  p50TimeToFirstAudio: number | null;
  p95TimeToFirstAudio: number | null;
  meanCost: number;
  stdDevCost: number;
  sampleSize: number;
}

export interface AnomalyEntry {
  callId: string;
  anomalies: string[];
  timestamp?: string;
}

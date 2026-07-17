"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  fetchCalls,
  fetchStats,
  fetchLatencyStats,
  fetchAnomalies,
} from "@/lib/api";
import { CallExecution, CallStats, LatencyBaseline, AnomalyEntry } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

export interface CallsState {
  connected: boolean;
  calls: Map<string, CallExecution>;
  stats: CallStats | null;
  latency: LatencyBaseline | null;
  anomalies: AnomalyEntry[];
  sortedCalls: CallExecution[];
}

export function useCallsSocket(): CallsState {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [calls, setCalls] = useState<Map<string, CallExecution>>(new Map());
  const [stats, setStats] = useState<CallStats | null>(null);
  const [latency, setLatency] = useState<LatencyBaseline | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyEntry[]>([]);
  const [sortedCalls, setSortedCalls] = useState<CallExecution[]>([]);

  // Sort calls whenever the map changes
  useEffect(() => {
    const arr = Array.from(calls.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setSortedCalls(arr);
  }, [calls]);

  // Fetch initial state, then connect socket
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const [callsData, statsData, latencyData, anomaliesData] = await Promise.allSettled([
        fetchCalls(),
        fetchStats(),
        fetchLatencyStats(),
        fetchAnomalies(),
      ]);

      if (cancelled) return;

      if (callsData.status === "fulfilled") {
        const map = new Map<string, CallExecution>();
        for (const c of callsData.value) map.set(c.id, c);
        setCalls(map);
      }
      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (latencyData.status === "fulfilled") setLatency(latencyData.value);
      if (anomaliesData.status === "fulfilled") setAnomalies(anomaliesData.value);
    }

    init();

    // Use polling transport only for reliability behind tunnels/proxies.
    // WebSocket transport often stalls through ngrok/cloudflared tunnels.
    // Polling is slightly higher latency (~100ms) but guaranteed delivery.
    const socket = io(WS_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WS] Connected:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WS] Disconnected:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("[WS] Connection error:", err.message);
      setConnected(false);
    });

    socket.on("reconnect", (attempt) => {
      console.log("[WS] Reconnected after", attempt, "attempts");
      setConnected(true);
    });

    socket.onAny((event, ...args) => {
      console.log("[WS] Event received:", event, args[0]?.id || args[0]?.callCount || "");
    });

    socket.on("call.updated", (call: CallExecution) => {
      setCalls((prev) => {
        const next = new Map(prev);
        const existed = next.has(call.id);
        next.set(call.id, call);
        console.log(`[WS] call.updated: ${call.id} status=${call.status} existed=${existed} mapSize=${next.size}`);
        return next;
      });
      // Refresh latency stats on every call update
      fetchLatencyStats().then(setLatency).catch(() => {});
    });

    socket.on("stats.updated", (s: CallStats) => {
      console.log("[WS] stats.updated: callCount=", s.callCount);
      setStats(s);
    });

    socket.on("call.anomaly", (payload: { call: CallExecution; anomalies: string[] }) => {
      console.log("[WS] call.anomaly:", payload.call.id, payload.anomalies);
      setAnomalies((prev) => {
        const entry: AnomalyEntry = {
          callId: payload.call.id,
          anomalies: payload.anomalies,
          timestamp: payload.call.createdAt,
        };
        return [entry, ...prev].slice(0, 20);
      });
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, []);

  return { connected, calls, stats, latency, anomalies, sortedCalls };
}

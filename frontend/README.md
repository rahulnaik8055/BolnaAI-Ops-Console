# Bolna Ops Console — Frontend

Dark-themed real-time operations dashboard for monitoring Bolna Voice AI calls. Connects to the NestJS backend over WebSocket for live updates.

## Setup

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

Run the dev server:

```bash
npm run dev
```

Opens at `http://localhost:3001` (backend expected on port 3000).

## Layout

Single page, three zones:

- **Left sidebar — Anomaly Feed**: Live-pushed anomaly flags from `call.anomaly` WebSocket events. Shows `HIGH_LATENCY` (amber), `COST_OUTLIER` (red), and `FAILED_HANGUP` (gray) as colored pills per call.
- **Center — Live Call Grid**: Card grid of all calls, most recent first. Updates in place on `call.updated` events. Each card shows status (color-coded), TTFA (highlighted red if above p95 baseline), cost, duration, and phone numbers. Click to expand for summary and details.
- **Right rail — Cost Panel**: Total spend, avg cost/call, projected monthly burn, and a Recharts donut chart of cost breakdown by component (LLM, synthesizer, transcriber, platform, network).

**Header strip**: Live connection indicator, latency baseline chip (p50/p95 from `/calls/latency-stats`), and "Test Call" button that opens an inline form to trigger outbound calls via `POST /calls/trigger`.

## WebSocket Events Consumed

| Event | Behavior |
|---|---|
| `call.updated` | Upserts call in grid, refreshes latency chip |
| `call.anomaly` | Prepends to anomaly feed (capped at 20) |
| `stats.updated` | Replaces cost panel stats |

## REST Endpoints Consumed (on mount)

- `GET /calls` — initial call grid
- `GET /calls/stats` — initial cost panel
- `GET /calls/latency-stats` — initial latency chip
- `GET /calls/anomalies` — initial anomaly feed

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (dark ops theme)
- socket.io-client for WebSocket
- Recharts for cost breakdown donut chart
- lucide-react for icons

# Bolna Ops Console — Backend

NestJS backend for real-time monitoring and management of Bolna Voice AI calls.

## Setup

```bash
npm install
npx prisma migrate dev --name init
npm run start:dev
```

Server runs on `http://localhost:3000` by default.

## Environment Variables

Copy `.env` and set your Bolna API key:

```
BOLNA_API_KEY=your_key_here
DATABASE_URL="file:./dev.db"
PORT=3000
```

## Endpoints

### Webhook Ingestion

**`POST /webhooks/bolna`** — Receives Bolna webhook payloads (upserts by execution id). Broadcasts `call.updated` over WebSocket. On `completed` status, also broadcasts `stats.updated`.

### Call Management

- **`POST /calls/trigger`** — Trigger an outbound call via Bolna API. Body: `{ agentId, recipientPhoneNumber }`
- **`GET /calls`** — List recent calls (up to 50, most recent first)
- **`GET /calls/stats`** — Aggregated cost stats: total spend, call count, avg cost/call, cost breakdown by component, projected monthly burn

### Latency & Anomaly Detection

- **`GET /calls/latency-stats`** — Current latency baseline computed from the last 100 calls: `p50TimeToFirstAudio`, `p95TimeToFirstAudio`, `meanCost`, `stdDevCost`, `sampleSize`. Baseline recomputes every 20 webhook events.
- **`GET /calls/anomalies`** — Most recent 20 flagged calls with their anomaly reasons. In-memory buffer, resets on server restart.

### WebSocket

Connect via Socket.IO to receive real-time updates:

```js
const io = require('socket.io-client')('http://localhost:3000');
io.on('call.updated', (call) => console.log('Call update:', call));
io.on('stats.updated', (stats) => console.log('Stats update:', stats));
```

Events:
- `call.updated` — Fired on every webhook ingestion
- `stats.updated` — Fired when a call reaches `completed` status
- `call.anomaly` — Fired when a call is flagged with one or more anomalies. Payload: `{ call: CallExecution, anomalies: string[] }`

### Anomaly Flags

Anomalies are computed on the fly at ingest time (not persisted to DB). Three types:

| Flag | Condition |
|---|---|
| `HIGH_LATENCY` | `timeToFirstAudio > p95` of recent calls (requires ≥20 baseline samples) |
| `COST_OUTLIER` | `totalCost > meanCost + 2 * stdDevCost` |
| `FAILED_HANGUP` | Status is `no-answer`, `busy`, `failed`, `canceled`, `stopped`, `error`, or `balance-low` |

Thresholds are defined as constants at the top of `latency-stats.service.ts`.

## Exposing Locally via ngrok

To receive webhooks from Bolna on your local machine:

```bash
ngrok http 3000
```

Then set the ngrok HTTPS URL as the webhook URL in your Bolna agent configuration (e.g., `https://<ngrok-id>.ngrok-free.app/webhooks/bolna`).

## Tech Stack

- NestJS + TypeScript
- Prisma ORM with SQLite (via better-sqlite3 adapter)
- Socket.IO for real-time WebSocket push
- @nestjs/config for environment variable management

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client disconnected: ${client.id}`);
  }

  broadcastCallUpdate(call: any) {
    if (!this.server) {
      console.warn('[WS] server not ready, skipping broadcast');
      return;
    }
    const count = this.server.engine ? this.server.engine.clientsCount : 0;
    console.log(`[WS] Broadcasting call.updated for ${call.id} (status=${call.status}) to ${count} clients`);
    this.server.emit('call.updated', call);
  }

  broadcastStatsUpdate(stats: any) {
    if (!this.server) return;
    this.server.emit('stats.updated', stats);
  }

  broadcastAnomaly(call: any, anomalies: string[]) {
    if (!this.server) return;
    this.server.emit('call.anomaly', { call, anomalies });
  }
}

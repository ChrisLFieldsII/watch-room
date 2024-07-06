import {
  MessageBody,
  OnGatewayInit,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private numConnections = 0;
  private analyticsInterval: NodeJS.Timeout;

  afterInit(server: Server) {
    server.on('connection', (socket) => {
      // console.log('socket connected', socket.id);
      this.numConnections++;

      socket.on('disconnect', (reason) => {
        this.numConnections--;
        // console.log('socket disconnected', reason, socket.id);
      });
    });

    this.logAnalytics();
  }

  handleDisconnect(client: any) {
    this.numConnections = 0;
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }
  }

  @SubscribeMessage('events')
  handleEvents(@MessageBody() data: any) {
    console.log('data', data);
    this.server.emit('events', data);
    return undefined;
  }

  private logAnalytics() {
    const printLog = () => {
      const analytics = {
        numConnections: this.numConnections,
      };
      console.log('analytics', JSON.stringify(analytics, null, 2));
    };

    this.analyticsInterval = setInterval(
      () => {
        printLog();
      },
      1000 * 60 * 60,
    );
  }
}

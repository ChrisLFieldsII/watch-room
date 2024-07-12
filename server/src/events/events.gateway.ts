import {
  MessageBody,
  OnGatewayInit,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppService } from 'src/app.service';

interface SocketMessage {
  type: string;
  data: any;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly appService: AppService) {}

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

  /**
   * Room process:
   *    client connects to server
   *    client emits 'joinRoom' event with roomId
   *    server joins socket to room
   *    client emits 'leaveRoom' event with roomId
   *    server leaves socket from room
   */
  @SubscribeMessage('events')
  handleEvents(
    @MessageBody() data: SocketMessage,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('data', data);
    const roomId = data.data.roomId;
    if (data.type === 'joinRoom') {
      for (const room of socket.rooms) {
        socket.leave(room);
      }
      socket.join(roomId);
    } else if (data.type === 'leaveRoom') {
      socket.leave(roomId);
    }
    // echo event to all clients in room
    else {
      socket.to(roomId).emit('events', data);
    }
    return undefined;
  }

  private logAnalytics() {
    const printLog = () => {
      const analytics = {
        numConnections: this.numConnections,
      };
      // console.log('analytics', JSON.stringify(analytics, null, 2));
      this.appService.cloudLogger.log(JSON.stringify({ analytics }, null, 2), {
        sendNow: true,
      });
    };

    this.analyticsInterval = setInterval(
      () => {
        printLog();
      },
      1000 * 60 * 60,
    );
  }
}

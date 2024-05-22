import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

// using port 3001 for the websocket server
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('events')
  handleEvents(@MessageBody() data: any) {
    console.log('data', data);
    this.server.emit('events', data);
    return undefined;
  }
}

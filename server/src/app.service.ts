import { Injectable } from '@nestjs/common';
import { CloudLogger } from '@chrislfieldsii/cloud-logger';

@Injectable()
export class AppService {
  cloudLogger = new CloudLogger({
    group: 'watch-room',
    stream: `watch-room-server-${process.env.ENV}`,
    sendInterval: 1000 * 60 * 10,
  });

  getHello(): string {
    this.cloudLogger.log('Server is healthy', { sendNow: true });
    return 'Hello World!';
  }
}

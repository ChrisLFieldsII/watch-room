import { Injectable } from '@nestjs/common';
import { CloudLogger } from '@chrislfieldsii/cloud-logger';

@Injectable()
export class AppService {
  cloudLogger = new CloudLogger({
    group: 'watch-room',
    stream: 'watch-room-server',
    sendInterval: 1000 * 60 * 10,
  });

  getHello(): string {
    return 'Hello World!';
  }
}

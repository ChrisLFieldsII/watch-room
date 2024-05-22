import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as http from 'node:http';
import { ShutdownObserver } from './shutdownObserver';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key: readFileSync(resolve(__dirname, 'secrets/localaws-key.pem')),
      cert: readFileSync(resolve(__dirname, 'secrets/localaws-cert.pem')),
    },
  });
  await app.listen(3000);

  // need a separate http server for certbot: https://certbot.eff.org/instructions?ws=other&os=arch
  const httpServer = http.createServer(app.getHttpAdapter().getInstance());
  httpServer.listen(80);

  const shutdownObserver = app.get(ShutdownObserver);
  shutdownObserver.addHttpServer(httpServer);
}
bootstrap();

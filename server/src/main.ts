import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key: readFileSync(resolve(__dirname, 'secrets/localaws-key.pem')),
      cert: readFileSync(resolve(__dirname, 'secrets/localaws-cert.pem')),
    },
  });
  await app.listen(3000);
}
bootstrap();

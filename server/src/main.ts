import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      // key: readFileSync('./src/secrets/local-key.pem'),
      // cert: readFileSync('./src/secrets/local-cert.pem'),
      key: readFileSync('/Users/cri/.local-ca/localhost+2-key.pem'),
      cert: readFileSync('/Users/cri/.local-ca/localhost+2.pem'),
    },
  });
  await app.listen(3000);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';

async function bootstrap() {
  console.log(
    `ENV=${process.env.ENV}\n`,
    `HTTPS_KEY_PATH=${process.env.HTTPS_KEY_PATH}\n`,
    `HTTPS_CERT_PATH=${process.env.HTTPS_CERT_PATH}`,
  );

  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key: readFileSync(process.env.HTTPS_KEY_PATH!),
      cert: readFileSync(process.env.HTTPS_CERT_PATH!),
    },
  });
  await app.listen(3000);
}
bootstrap();

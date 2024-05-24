import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { ShutdownObserver } from './shutdownObserver';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    EventsModule,
    ConfigModule.forRoot({
      envFilePath: process.env.ENV === 'dev' ? '.env.dev' : '.env.prod',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ShutdownObserver],
})
export class AppModule {}

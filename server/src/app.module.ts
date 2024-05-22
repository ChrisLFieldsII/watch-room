import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { ShutdownObserver } from './shutdownObserver';

@Module({
  imports: [EventsModule],
  controllers: [AppController],
  providers: [AppService, ShutdownObserver],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MovementsService } from './services/movements.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [MovementsService],
})
export class AppModule {}

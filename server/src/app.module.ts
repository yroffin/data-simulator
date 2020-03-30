import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ModelModule } from './model/model.module';

@Module({
  imports: [ModelModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

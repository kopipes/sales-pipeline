import { Module } from '@nestjs/common';
import { DivisionsService } from './divisions.service';
import { DivisionsController } from './divisions.controller';

@Module({
  controllers: [DivisionsController],
  providers: [DivisionsService],
  exports: [DivisionsService],
})
export class DivisionsModule {}

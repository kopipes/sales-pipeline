import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { SearchService } from './search.service';
import { ExportService } from './export.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, SearchService, ExportService],
  exports: [DashboardService, SearchService, ExportService],
})
export class DashboardModule {}

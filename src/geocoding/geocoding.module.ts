// geocoding/geocoding.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeocodingService } from './geocoding.service';
import { GeocodingController } from './geocoding.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    })
  ],
  providers: [GeocodingService],
  controllers: [GeocodingController],
  exports: [GeocodingService],
})
export class GeocodingModule {}
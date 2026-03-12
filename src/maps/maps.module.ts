import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';

@Module({
  providers: [MapsService],
  exports: [MapsService],
  // export عشان كل موديول يحتاج Google Maps يستورده
})
export class MapsModule {}
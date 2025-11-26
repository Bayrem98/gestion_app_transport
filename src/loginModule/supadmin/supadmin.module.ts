import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupadminSchema } from './schemas/supadmin.schema';
import { SupadminController } from './supadmin.controller';
import { SupadminService } from './supadmin.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Supadmin', schema: SupadminSchema }]),
  ],
  controllers: [SupadminController],
  providers: [SupadminService],
  exports: [SupadminService],
})
export class SupadminModule {}

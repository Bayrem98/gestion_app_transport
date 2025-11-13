import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AffectationsController } from './affectations.controller';
import { AffectationsService } from './affectations.service';
import { Affectation, AffectationSchema } from './schemas/affectation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Affectation.name, schema: AffectationSchema }
    ]),
  ],
  controllers: [AffectationsController],
  providers: [AffectationsService],
  exports: [AffectationsService],
})
export class AffectationsModule {}
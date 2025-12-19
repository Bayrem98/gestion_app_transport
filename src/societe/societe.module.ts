import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Societe, SocieteSchema } from './schemas/societe.schema';
import { SocieteService } from './societe.service';
import { SocieteController } from './societe.controller';

@Module({
 imports: [
   MongooseModule.forFeature([{ name: Societe.name, schema: SocieteSchema }]),
 ],
  providers: [SocieteService],
  controllers: [SocieteController],
  exports: [SocieteService],
})
export class SocieteModule {}

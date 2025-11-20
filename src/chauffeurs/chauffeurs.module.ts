import { Module } from '@nestjs/common';
import { ChauffeursController } from './chauffeurs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChauffeursService } from './chauffeurs.service';
import { Chauffeur, ChauffeurSchema } from './schemas/chauffeur.schema';

@Module({
   imports: [
      MongooseModule.forFeature([{ name: Chauffeur.name, schema: ChauffeurSchema }]),
    ],
    controllers: [ChauffeursController],
    providers: [ChauffeursService],
    exports: [ChauffeursService],
})
export class ChauffeursModule {}

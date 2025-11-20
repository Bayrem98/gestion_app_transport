import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { AffectationsModule } from './affectations/affectations.module';
import { PlanningModule } from './planning/planning.module';
import { StatistiquesModule } from './statistiques/statistiques.module';
import { ChauffeursModule } from './chauffeurs/chauffeurs.module';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.gjbdf3j.mongodb.net/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`,
    ),
    AgentsModule,
    AffectationsModule,
    PlanningModule,
    ChauffeursModule,
    // StatistiquesModule,
  ],
})
export class AppModule {}
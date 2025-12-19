import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { Agent, AgentSchema } from './schemas/agent.schema';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { Societe, SocieteSchema } from 'src/societe/schemas/societe.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Agent.name, schema: AgentSchema },
      { name: Societe.name, schema: SocieteSchema }
    ]),
    GeocodingModule,
  ],
  providers: [AgentsService],
  controllers: [AgentsController],
  exports: [AgentsService],
})
export class AgentsModule {}
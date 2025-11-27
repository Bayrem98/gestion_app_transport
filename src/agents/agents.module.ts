import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { Agent, AgentSchema } from './schemas/agent.schema';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Agent.name, schema: AgentSchema }]),
    GeocodingModule,
  ],
  providers: [AgentsService],
  controllers: [AgentsController],
  exports: [AgentsService],
})
export class AgentsModule {}
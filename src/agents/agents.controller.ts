import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  NotFoundException 
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { Agent } from './schemas/agent.schema';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  async findAll(): Promise<Agent[]> {
    return this.agentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Agent> {
    return this.agentsService.findOne(id);
  }

  @Get('nom/:nom')
  async findByNom(@Param('nom') nom: string): Promise<Agent> {
    const agent = await this.agentsService.findByNom(nom);
    if (!agent) {
      throw new NotFoundException(`Agent avec le nom ${nom} non trouvé`);
    }
    return agent;
  }

  @Post()
  async create(@Body() agentData: Partial<Agent>): Promise<Agent> {
    return this.agentsService.create(agentData);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() agentData: Partial<Agent>,
  ): Promise<Agent> {
    return this.agentsService.update(id, agentData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.agentsService.delete(id);
  }

  @Post('verifier-manquants')
  async verifierAgentsManquants(@Body() nomsAgents: string[]): Promise<string[]> {
    return this.agentsService.findAgentsManquants(nomsAgents);
  }
}
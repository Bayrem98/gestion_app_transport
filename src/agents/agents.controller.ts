import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { Agent } from './schemas/agent.schema';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  async findAll(): Promise<Agent[]> {
    return this.agentsService.findAll();
  }

  @Get('without-coordinates')
  async findWithoutCoordinates(): Promise<Agent[]> {
    return this.agentsService.findWithoutCoordinates();
  }

  @Get('with-coordinates')
  async findWithCoordinates(): Promise<Agent[]> {
    return this.agentsService.findWithCoordinates();
  }

  @Get('geocoding-stats')
  async getGeocodingStats() {
    return this.agentsService.getGeocodingStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Agent> {
    return this.agentsService.findOne(id);
  }

  @Post()
  async create(@Body() agentData: Partial<Agent>): Promise<Agent> {
    return this.agentsService.create(agentData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() agentData: Partial<Agent>): Promise<Agent> {
    return this.agentsService.update(id, agentData);
  }

  @Put(':id/coordinates')
  async updateCoordinates(
    @Param('id') id: string,
    @Body() coordinates: { latitude: number; longitude: number }
  ): Promise<Agent> {
    return this.agentsService.updateCoordinates(id, coordinates.latitude, coordinates.longitude);
  }

  @Post(':id/geocode')
  async geocodeAgent(@Param('id') id: string): Promise<Agent> {
    return this.agentsService.geocodeAgentAddress(id);
  }

  @Post('geocode/all')
  async geocodeAllAgents() {
    return this.agentsService.geocodeAllAgentsWithoutCoordinates();
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.agentsService.delete(id);
  }
}
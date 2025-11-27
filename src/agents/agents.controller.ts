import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AgentsService } from './agents.service';
import { Agent } from './schemas/agent.schema';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  // ========== ROUTES GET SPÉCIFIQUES ==========
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

  // ========== TOUTES LES ROUTES POST DOIVENT ÊTRE ICI ==========
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importAgents(@UploadedFile() file: Express.Multer.File) {
    console.log('✅ Route POST /agents/import appelée !');
    
    if (!file) {
      throw new Error('Aucun fichier uploadé');
    }

    const result = await this.agentsService.importAgentsFromFile(file);
    return {
      message: 'Importation réussie',
      importedCount: result.importedCount,
      errors: result.errors
    };
  }

  @Post()
  async create(@Body() agentData: Partial<Agent>): Promise<Agent> {
    return this.agentsService.create(agentData);
  }

  @Post('geocode/all')
  async geocodeAllAgents() {
    return this.agentsService.geocodeAllAgentsWithoutCoordinates();
  }

  // ========== ROUTES AVEC PARAMÈTRES EN DERNIER ==========
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Agent> {
    return this.agentsService.findOne(id);
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

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.agentsService.delete(id);
  }
}
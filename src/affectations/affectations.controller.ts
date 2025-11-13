import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AffectationsService } from './affectations.service';
import { Affectation } from './schemas/affectation.schema';

@Controller('affectations')
export class AffectationsController {
  constructor(private readonly affectationsService: AffectationsService) {}

  @Get()
  async findAll(): Promise<Affectation[]> {
    return this.affectationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Affectation> {
    return this.affectationsService.findOne(id);
  }

  @Post()
  async create(@Body() affectationData: Partial<Affectation>): Promise<Affectation> {
    return this.affectationsService.create(affectationData);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() affectationData: Partial<Affectation>,
  ): Promise<Affectation> {
    return this.affectationsService.update(id, affectationData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.affectationsService.delete(id);
  }

  @Get('chauffeur/:chauffeur')
  async findByChauffeur(@Param('chauffeur') chauffeur: string): Promise<Affectation[]> {
    return this.affectationsService.findByChauffeur(chauffeur);
  }

  @Get('statistiques/mensuelles')
  async getStatistiquesMensuelles(
    @Query('mois') mois?: number,
    @Query('annee') annee?: number,
  ): Promise<any> {
    return this.affectationsService.getStatistiquesMensuelles(mois, annee);
  }
}
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SocieteService } from './societe.service';
import { Societe } from './schemas/societe.schema';

@Controller('societe')
export class SocieteController {
  constructor(private readonly societeService: SocieteService) {}

  @Get()
  async findAll(): Promise<Societe[]> {
    return this.societeService.findAll();
  }

  @Get('search')
  async search(@Query('q') query: string): Promise<Societe[]> {
    return this.societeService.search(query);
  }

  @Post()
  async create(@Body() societeData: Partial<Societe>): Promise<Societe> {
    return this.societeService.create(societeData);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Societe> {
    return this.societeService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() societeData: Partial<Societe>,
  ): Promise<Societe> {
    return this.societeService.update(id, societeData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.societeService.delete(id);
  }
}

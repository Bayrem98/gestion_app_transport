import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { ChauffeursService } from './chauffeurs.service';
import { Chauffeur } from './schemas/chauffeur.schema';

@Controller('chauffeurs')
export class ChauffeursController {
    constructor(private readonly chauffeursService: ChauffeursService) {}
    
      @Get()
      async findAll(): Promise<Chauffeur[]> {
        return this.chauffeursService.findAll();
      }
    
      @Get(':id')
      async findOne(@Param('id') id: string): Promise<Chauffeur> {
        return this.chauffeursService.findOne(id);
      }
    
      @Get('nom/:nom')
      async findByNom(@Param('nom') nom: string): Promise<Chauffeur> {
        const chauffeur = await this.chauffeursService.findByNom(nom);
        if (!chauffeur) {
          throw new NotFoundException(`Chauffeur avec le nom ${nom} non trouvé`);
        }
        return chauffeur;
      }
    
      @Post()
      async create(@Body() chaffeurData: Partial<Chauffeur>): Promise<Chauffeur> {
        return this.chauffeursService.create(chaffeurData);
      }
    
      @Put(':id')
      async update(
        @Param('id') id: string,
        @Body() chaffeurData: Partial<Chauffeur>,
      ): Promise<Chauffeur> {
        return this.chauffeursService.update(id, chaffeurData);
      }
    
      @Delete(':id')
      async delete(@Param('id') id: string): Promise<void> {
        return this.chauffeursService.delete(id);
      }
}

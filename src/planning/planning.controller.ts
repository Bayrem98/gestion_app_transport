import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlanningService } from './planning.service';
import { PlanningData } from 'src/shared/types';


@Controller('planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPlanning(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PlanningData[]> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier le type de fichier
    if (!file.mimetype.includes('spreadsheet') && 
        !file.mimetype.includes('excel') &&
        !file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new BadRequestException('Seuls les fichiers Excel sont autorisés');
    }

    // Vérifier la taille du fichier (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('Fichier trop volumineux (max 50MB)');
    }

    try {
      return await this.planningService.traiterFichierExcel(file.buffer);
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors du traitement du fichier: ${error.message}`,
      );
    }
  }
}
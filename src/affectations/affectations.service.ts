import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Affectation } from './schemas/affectation.schema';

@Injectable()
export class AffectationsService {
  constructor(
    @InjectModel(Affectation.name) private affectationModel: Model<Affectation>,
  ) {}

  async findAll(): Promise<Affectation[]> {
    return this.affectationModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Affectation> {
    const affectation = await this.affectationModel.findById(id).exec();
    if (!affectation) {
      throw new NotFoundException('Affectation non trouvée');
    }
    return affectation;
  }

  async create(affectationData: Partial<Affectation>): Promise<Affectation> {
    const affectation = new this.affectationModel(affectationData);
    return affectation.save();
  }

  async update(
    id: string,
    affectationData: Partial<Affectation>,
  ): Promise<Affectation> {
    const affectation = await this.affectationModel
      .findByIdAndUpdate(id, affectationData, { new: true })
      .exec();
    if (!affectation) {
      throw new NotFoundException('Affectation non trouvée');
    }
    return affectation;
  }

  async delete(id: string): Promise<void> {
    const result = await this.affectationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Affectation non trouvée');
    }
  }

  async findByChauffeur(chauffeur: string): Promise<Affectation[]> {
    return this.affectationModel.find({ chauffeur }).exec();
  }

  async findByPeriode(mois: number, annee: number): Promise<Affectation[]> {
    // Implémentation pour filtrer par période
    const debutMois = new Date(annee, mois - 1, 1);
    const finMois = new Date(annee, mois, 0);
    
    return this.affectationModel.find({
      dateReelle: {
        $gte: debutMois.toISOString(),
        $lte: finMois.toISOString()
      }
    }).exec();
  }

  async getStatistiquesMensuelles(mois?: number, annee?: number): Promise<any> {
    let filter = {};
    
    if (mois && annee) {
      const debutMois = new Date(annee, mois - 1, 1);
      const finMois = new Date(annee, mois, 0);
      filter = {
        dateReelle: {
          $gte: debutMois.toISOString(),
          $lte: finMois.toISOString()
        }
      };
    }

    const affectations = await this.affectationModel.find(filter).exec();
    
    const statistiques = {
      totalCourses: affectations.length,
      chauffeursNormaux: {},
      chauffeursTaxi: {},
      societesNormaux: {},
      societesTaxi: {},
      totalMontant: 0
    };

    affectations.forEach(affectation => {
      const isTaxi = affectation.chauffeur.toLowerCase().includes('taxi');
      const prix = affectation.prixCourse || 0;

      // Compter par chauffeur
      const keyChauffeurs = isTaxi ? 'chauffeursTaxi' : 'chauffeursNormaux';
      if (!statistiques[keyChauffeurs][affectation.chauffeur]) {
        statistiques[keyChauffeurs][affectation.chauffeur] = 0;
      }
      statistiques[keyChauffeurs][affectation.chauffeur]++;

      // Compter par société
      const keySocietes = isTaxi ? 'societesTaxi' : 'societesNormaux';
      if (!statistiques[keySocietes][affectation.societe]) {
        statistiques[keySocietes][affectation.societe] = 0;
      }
      statistiques[keySocietes][affectation.societe]++;

      statistiques.totalMontant += prix;
    });

    return statistiques;
  }
}
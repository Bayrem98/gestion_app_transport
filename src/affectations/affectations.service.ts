import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Affectation } from './schemas/affectation.schema';

@Injectable()
export class AffectationsService {
  constructor(
    @InjectModel(Affectation.name) private affectationModel: Model<Affectation>,
  ) {}

  // Méthode pour normaliser les données (ancien format → nouveau format)
  private normaliserAffectation(affectation: any): any {
    // Si l'affectation a l'ancien format (agentNom existe) mais pas le nouveau format (agents)
    if (affectation.agentNom && (!affectation.agents || affectation.agents.length === 0)) {
      return {
        ...affectation.toObject ? affectation.toObject() : affectation,
        agents: [{
          agentNom: affectation.agentNom,
          adresse: affectation.adresse,
          telephone: affectation.telephone,
          societe: affectation.societe
        }]
      };
    }
    
    // Si l'affectation a déjà le nouveau format, la retourner telle quelle
    return affectation.toObject ? affectation.toObject() : affectation;
  }

  // Méthode pour préparer les données avant sauvegarde
  private preparerDonneesSauvegarde(affectationData: Partial<Affectation>): any {
    const donnees = { ...affectationData };
    
    // S'assurer que agents est un tableau valide
    if (!donnees.agents || !Array.isArray(donnees.agents)) {
      donnees.agents = [];
    }

    // Nettoyer les anciens champs individuels pour éviter les conflits
    delete donnees.agentNom;
    delete donnees.adresse;
    delete donnees.telephone;
    delete donnees.societe;

    return donnees;
  }

  async findAll(): Promise<Affectation[]> {
    const affectations = await this.affectationModel.find().sort({ createdAt: -1 }).exec();
    return affectations.map(aff => this.normaliserAffectation(aff));
  }

  async findOne(id: string): Promise<Affectation> {
    const affectation = await this.affectationModel.findById(id).exec();
    if (!affectation) {
      throw new NotFoundException('Affectation non trouvée');
    }
    return this.normaliserAffectation(affectation);
  }

  async create(affectationData: Partial<Affectation>): Promise<Affectation> {
    const donneesPrepared = this.preparerDonneesSauvegarde(affectationData);
    const affectation = new this.affectationModel(donneesPrepared);
    const savedAffectation = await affectation.save();
    return this.normaliserAffectation(savedAffectation);
  }

  async update(
    id: string,
    affectationData: Partial<Affectation>,
  ): Promise<Affectation> {
    const donneesPrepared = this.preparerDonneesSauvegarde(affectationData);
    
    const affectation = await this.affectationModel
      .findByIdAndUpdate(id, donneesPrepared, { new: true })
      .exec();
      
    if (!affectation) {
      throw new NotFoundException('Affectation non trouvée');
    }
    
    return this.normaliserAffectation(affectation);
  }

  async delete(id: string): Promise<void> {
    const result = await this.affectationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Affectation non trouvée');
    }
  }

  async findByChauffeur(chauffeur: string): Promise<Affectation[]> {
    const affectations = await this.affectationModel.find({ chauffeur }).exec();
    return affectations.map(aff => this.normaliserAffectation(aff));
  }

  async findByPeriode(mois: number, annee: number): Promise<Affectation[]> {
    const debutMois = new Date(annee, mois - 1, 1);
    const finMois = new Date(annee, mois, 0);
    
    const affectations = await this.affectationModel.find({
      dateReelle: {
        $gte: debutMois.toISOString(),
        $lte: finMois.toISOString()
      }
    }).exec();
    
    return affectations.map(aff => this.normaliserAffectation(aff));
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
    const affectationsNormalisees = affectations.map(aff => this.normaliserAffectation(aff));
    
    const statistiques = {
      totalCourses: affectationsNormalisees.length,
      totalAgentsTransportes: 0,
      chauffeursNormaux: {},
      chauffeursTaxi: {},
      societesNormaux: {},
      societesTaxi: {},
      totalMontant: 0
    };

    affectationsNormalisees.forEach(affectation => {
      const isTaxi = affectation.chauffeur.toLowerCase().includes('taxi');
      const prix = affectation.prixCourse || 0;

      // Compter par chauffeur
      const keyChauffeurs = isTaxi ? 'chauffeursTaxi' : 'chauffeursNormaux';
      if (!statistiques[keyChauffeurs][affectation.chauffeur]) {
        statistiques[keyChauffeurs][affectation.chauffeur] = 0;
      }
      statistiques[keyChauffeurs][affectation.chauffeur]++;

      // Compter le nombre total d'agents transportés
      if (affectation.agents && Array.isArray(affectation.agents)) {
        statistiques.totalAgentsTransportes += affectation.agents.length;

        // Compter par société (basé sur les agents)
        affectation.agents.forEach(agent => {
          const keySocietes = isTaxi ? 'societesTaxi' : 'societesNormaux';
          if (agent.societe) {
            if (!statistiques[keySocietes][agent.societe]) {
              statistiques[keySocietes][agent.societe] = 0;
            }
            statistiques[keySocietes][agent.societe]++;
          }
        });
      }

      statistiques.totalMontant += prix;
    });

    return statistiques;
  }

  // Méthode utilitaire pour migrer les anciennes données (optionnel)
  async migrerAnciennesDonnees(): Promise<{ migrated: number; errors: number }> {
    try {
      const anciennesAffectations = await this.affectationModel.find({
        $or: [
          { agents: { $exists: false } },
          { agents: { $size: 0 } },
          { agentNom: { $exists: true } }
        ]
      }).exec();

      let migrated = 0;
      let errors = 0;

      for (const ancienneAff of anciennesAffectations) {
        try {
          if (ancienneAff.agentNom) {
            await this.affectationModel.findByIdAndUpdate(
              ancienneAff._id,
              {
                $set: {
                  agents: [{
                    agentNom: ancienneAff.agentNom,
                    adresse: ancienneAff.adresse,
                    telephone: ancienneAff.telephone,
                    societe: ancienneAff.societe
                  }]
                },
                $unset: {
                  agentNom: "",
                  adresse: "",
                  telephone: "",
                  societe: ""
                }
              }
            );
            migrated++;
          }
        } catch (error) {
          console.error(`Erreur migration affectation ${ancienneAff._id}:`, error);
          errors++;
        }
      }

      return { migrated, errors };
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      throw error;
    }
  }
}
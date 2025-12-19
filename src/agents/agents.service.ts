import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Agent, AgentDocument } from './schemas/agent.schema';
import { GeocodingService } from '../geocoding/geocoding.service';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { Societe, SocieteDocument } from 'src/societe/schemas/societe.schema';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
    @InjectModel(Societe.name) private societeModel: Model<SocieteDocument>, // Ajout
    private readonly geocodingService: GeocodingService,
  ) {}

   async findAll(): Promise<any[]> {
    return this.agentModel.find()
      .select('-__v')  // Exclure le champ __v
      .sort({ nom: 1 })
      .lean()  // Retourner des objets JavaScript simples (plus rapide)
      .exec();
  }

    async findOne(id: string): Promise<any> {
    const agent = await this.agentModel.findById(id).lean().exec();
    if (!agent) {
      throw new NotFoundException('Agent non trouvé');
    }
    return agent;
  }

  async findByNom(nom: string): Promise<Agent | null> {
    return this.agentModel.findOne({ nom }).populate('societe').exec(); // Modifié
  }

  async create(agentData: Partial<Agent>): Promise<any> {
    const agent = new this.agentModel(agentData);
    const savedAgent = await agent.save();
    return this.findOne(savedAgent._id.toString());
  }

  async update(id: string, agentData: Partial<Agent>): Promise<Agent> {
    // Vérifier si la société existe avant de mettre à jour
    if (agentData.societe) {
      const societeId = agentData.societe as unknown as string;
      const societeExists = await this.societeModel.findById(societeId).exec();
      if (!societeExists) {
        throw new NotFoundException(`Société avec l'ID ${societeId} non trouvée`);
      }
    }

    const existingAgent = await this.findOne(id);
    
    const agent = await this.agentModel
      .findByIdAndUpdate(id, agentData, { new: true })
      .exec();
    
    if (!agent) {
      throw new NotFoundException('Agent non trouvé');
    }

    // Si l'adresse a changé, regéocoder
    if (agentData.adresse && agentData.adresse !== existingAgent.adresse) {
      try {
        await this.geocodeAgentAddress(id);
      } catch (error) {
        this.logger.warn(`Échec géocodage après mise à jour pour ${agent.nom}: ${error.message}`);
      }
    }

    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.agentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Agent non trouvé');
    }
  }

  async findAgentsManquants(planningAgents: string[]): Promise<string[]> {
    const agentsExistants = await this.agentModel
      .find({ nom: { $in: planningAgents } })
      .populate('societe') // Ajout
      .exec();
    
    const nomsAgentsExistants = agentsExistants.map(agent => agent.nom);
    return planningAgents.filter(nom => !nomsAgentsExistants.includes(nom));
  }

  // NOUVELLES MÉTHODES POUR LA SOCIÉTÉ (AJOUTÉES)
  async findAgentsBySociete(societeId: string): Promise<Agent[]> {
    return this.agentModel
      .find({ societe: new Types.ObjectId(societeId) })
      .populate('societe')
      .exec();
  }

  async getSocieteForAgent(agentId: string): Promise<Societe> {
    const agent = await this.agentModel
      .findById(agentId)
      .populate('societe')
      .exec();
    
    if (!agent) {
      throw new NotFoundException('Agent non trouvé');
    }
    
    if (!agent.societe) {
      throw new NotFoundException('Société non trouvée pour cet agent');
    }
    
    return agent.societe as unknown as Societe;
  }

  // NOUVELLES MÉTHODES POUR L'IMPORTATION

  /**
   * Importer des agents depuis un fichier Excel ou CSV
   */
  async importAgentsFromFile(file: Express.Multer.File): Promise<{ importedCount: number; errors: string[] }> {
    try {
      this.logger.log(`Importation du fichier: ${file.originalname}`);
      
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en JSON
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      // DEBUG: Afficher la structure du fichier
      console.log('=== DEBUG STRUCTURE FICHIER ===');
      console.log('Nombre de lignes:', data.length);
      if (data.length > 0) {
        console.log('Première ligne:', data[0]);
        console.log('Clés de la première ligne:', Object.keys(data[0] as object));
      }
      console.log('=== FIN DEBUG ===');
      
      let importedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i] as any;
          const rowNumber = i + 2; // +2 car ligne 1 = en-têtes, et i commence à 0

          // Normaliser les noms de colonnes (gérer minuscules/majuscules)
          const normalizedRow = this.normalizeRowData(row);

          // Validation des champs requis avec noms normalisés
          if (!normalizedRow.nom || !normalizedRow.telephone || !normalizedRow.adresse) {
            errors.push(`Ligne ${rowNumber}: Champs requis manquants (nom, telephone, adresse)`);
            continue;
          }

          // Vérifier si l'agent existe déjà
          const existingAgent = await this.findByNom(normalizedRow.nom);
          if (existingAgent) {
            errors.push(`Ligne ${rowNumber}: Agent "${normalizedRow.nom}" existe déjà`);
            continue;
          }

          // Gestion de la société
          let societeId: Types.ObjectId | null = null;
          if (normalizedRow.societe) {
            // Chercher d'abord par nom
            const societe = await this.societeModel.findOne({ 
              nom: normalizedRow.societe 
            }).exec();
            
            if (societe) {
              societeId = societe._id as Types.ObjectId;
            } else if (normalizedRow.societe.match(/^[0-9a-fA-F]{24}$/)) {
              // Si c'est un ObjectId valide, vérifier s'il existe
              const societeById = await this.societeModel.findById(normalizedRow.societe).exec();
              if (societeById) {
                societeId = societeById._id as Types.ObjectId;
              } else {
                errors.push(`Ligne ${rowNumber}: Société "${normalizedRow.societe}" non trouvée`);
                continue;
              }
            } else {
              errors.push(`Ligne ${rowNumber}: Société "${normalizedRow.societe}" non trouvée`);
              continue;
            }
          }

          // Préparer les données de l'agent
          const agentData: Partial<Agent> = {
            nom: normalizedRow.nom,
            telephone: normalizedRow.telephone,
            adresse: normalizedRow.adresse,
            societe: societeId as any, // Assigner l'ID de la société
            voiturePersonnelle: this.parseBoolean(normalizedRow.voiturepersonnelle || normalizedRow.voitureperso || normalizedRow['voiture perso']),
            chauffeurNom: normalizedRow.chauffeurnom || '',
            vehiculeChauffeur: normalizedRow.vehiculechauffeur || '',
          };

          // Créer l'agent
          await this.create(agentData);
          importedCount++;

          this.logger.log(`Agent importé: ${normalizedRow.nom}`);

        } catch (error) {
          errors.push(`Ligne ${i + 2}: ${error.message}`);
        }
      }

      this.logger.log(`Importation terminée: ${importedCount} agents importés, ${errors.length} erreurs`);
      
      return { importedCount, errors };

    } catch (error) {
      this.logger.error('Erreur lors de l\'importation du fichier:', error);
      throw new Error(`Erreur lors de l'importation: ${error.message}`);
    }
  }

  /**
   * Normaliser les noms de colonnes pour gérer différentes casse
   */
  private normalizeRowData(row: any): any {
    const normalized: any = {};
    
    for (const key in row) {
      if (row.hasOwnProperty(key)) {
        // Convertir en minuscules et supprimer les espaces
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
        normalized[normalizedKey] = row[key];
      }
    }
    
    return normalized;
  }

  /**
   * Parser les valeurs booléennes
   */
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value.toLowerCase() === 'oui' || value === '1';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  }

  // MÉTHODES EXISTANTES POUR LE GÉOCODAGE

  async geocodeAgentAddress(agentId: string): Promise<Agent> {
    try {
      const agent = await this.findOne(agentId);
      
      this.logger.log(`Géocodage de l'adresse pour ${agent.nom}: ${agent.adresse}`);
      
      const coordinates = await this.geocodingService.geocodeAddress(agent.adresse);
      
      // Mettre à jour l'agent avec les coordonnées
      const updatedAgent = await this.agentModel.findByIdAndUpdate(
        agentId,
        {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          lastGeocoded: new Date()
        },
        { new: true }
      ).exec();

      if (!updatedAgent) {
        throw new NotFoundException('Agent non trouvé après mise à jour');
      }

      this.logger.log(`Adresse géocodée avec succès pour ${agent.nom}: ${coordinates.lat}, ${coordinates.lng}`);
      
      return updatedAgent;
    } catch (error) {
      this.logger.error(`Erreur géocodage pour l'agent ${agentId}:`, error);
      throw new Error(`Impossible de géocoder l'adresse: ${error.message}`);
    }
  }

  async geocodeAllAgentsWithoutCoordinates(): Promise<{ success: number; errors: number }> {
    try {
      const agentsSansCoords = await this.agentModel.find({
        $or: [
          { latitude: { $exists: false } },
          { longitude: { $exists: false } },
          { latitude: null },
          { longitude: null }
        ]
      }).populate('societe').exec(); // Ajout

      this.logger.log(`Géocodage de ${agentsSansCoords.length} agents sans coordonnées`);

      let successCount = 0;
      let errorCount = 0;

      for (const agent of agentsSansCoords) {
        try {
          if (agent._id) {
            await this.geocodeAgentAddress(agent._id.toString());
            successCount++;
            
            // Pause pour respecter les limites de l'API
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          errorCount++;
          this.logger.error(`Échec géocodage pour ${agent.nom}:`, error);
        }
      }

      this.logger.log(`Géocodage terminé: ${successCount} succès, ${errorCount} erreurs`);
      
      return { success: successCount, errors: errorCount };
    } catch (error) {
      this.logger.error('Erreur lors du géocodage en masse:', error);
      throw error;
    }
  }

  async updateCoordinates(agentId: string, latitude: number, longitude: number): Promise<Agent> {
    try {
      const agent = await this.agentModel.findByIdAndUpdate(
        agentId,
        {
          latitude,
          longitude,
          lastGeocoded: new Date()
        },
        { new: true }
      ).exec();

      if (!agent) {
        throw new NotFoundException('Agent non trouvé');
      }

      this.logger.log(`Coordonnées mises à jour pour ${agent.nom}: ${latitude}, ${longitude}`);
      
      return agent;
    } catch (error) {
      this.logger.error(`Erreur mise à jour coordonnées pour ${agentId}:`, error);
      throw error;
    }
  }

  async findWithoutCoordinates(): Promise<Agent[]> {
    return this.agentModel.find({
      $or: [
        { latitude: { $exists: false } },
        { longitude: { $exists: false } },
        { latitude: null },
        { longitude: null }
      ]
    }).populate('societe').exec(); // Ajout
  }

  async findWithCoordinates(): Promise<Agent[]> {
    return this.agentModel.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    }).populate('societe').exec(); // Ajout
  }

  async getGeocodingStats(): Promise<{
    total: number;
    withCoordinates: number;
    withoutCoordinates: number;
    lastGeocoded: Date | null;
  }> {
    const total = await this.agentModel.countDocuments();
    const withCoordinates = await this.agentModel.countDocuments({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    });
    const withoutCoordinates = total - withCoordinates;
    
    const lastGeocodedAgent = await this.agentModel
      .findOne({ lastGeocoded: { $exists: true } })
      .populate('societe') // Ajout
      .sort({ lastGeocoded: -1 })
      .exec();

    return {
      total,
      withCoordinates,
      withoutCoordinates,
      lastGeocoded: lastGeocodedAgent?.lastGeocoded || null
    };
  }
}
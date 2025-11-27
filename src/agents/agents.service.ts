import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Agent, AgentDocument } from './schemas/agent.schema';
import { GeocodingService } from '../geocoding/geocoding.service';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
    private readonly geocodingService: GeocodingService,
  ) {}

  async findAll(): Promise<Agent[]> {
    return this.agentModel.find().exec();
  }

  async findOne(id: string): Promise<Agent> {
    const agent = await this.agentModel.findById(id).exec();
    if (!agent) {
      throw new NotFoundException('Agent non trouvé');
    }
    return agent;
  }

  async findByNom(nom: string): Promise<Agent | null> {
    return this.agentModel.findOne({ nom }).exec();
  }

  async create(agentData: Partial<Agent>): Promise<Agent> {
    const agent = new this.agentModel(agentData);
    const savedAgent = await agent.save();
    
    // Géocoder automatiquement l'adresse après création
    if (savedAgent._id) {
      try {
        await this.geocodeAgentAddress(savedAgent._id.toString());
      } catch (error) {
        this.logger.warn(`Échec géocodage automatique pour ${savedAgent.nom}: ${error.message}`);
      }
    }
    
    return this.findOne(savedAgent._id.toString());
  }

  async update(id: string, agentData: Partial<Agent>): Promise<Agent> {
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
      .exec();
    
    const nomsAgentsExistants = agentsExistants.map(agent => agent.nom);
    return planningAgents.filter(nom => !nomsAgentsExistants.includes(nom));
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
        if (!normalizedRow.nom || !normalizedRow.telephone || !normalizedRow.adresse || !normalizedRow.societe) {
          errors.push(`Ligne ${rowNumber}: Champs requis manquants (nom, telephone, adresse, societe)`);
          continue;
        }

        // Vérifier si l'agent existe déjà
        const existingAgent = await this.findByNom(normalizedRow.nom);
        if (existingAgent) {
          errors.push(`Ligne ${rowNumber}: Agent "${normalizedRow.nom}" existe déjà`);
          continue;
        }

        // Préparer les données de l'agent
        const agentData: Partial<Agent> = {
          nom: normalizedRow.nom,
          telephone: normalizedRow.telephone,
          adresse: normalizedRow.adresse,
          societe: normalizedRow.societe,
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
      }).exec();

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
    }).exec();
  }

  async findWithCoordinates(): Promise<Agent[]> {
    return this.agentModel.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    }).exec();
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
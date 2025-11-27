// agents.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Agent, AgentDocument } from './schemas/agent.schema';
import { GeocodingService } from '../geocoding/geocoding.service';

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
      await this.geocodeAgentAddress(savedAgent._id.toString());
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
      await this.geocodeAgentAddress(id);
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

  // NOUVELLES MÉTHODES POUR LE GÉOCODAGE

  /**
   * Géocoder l'adresse d'un agent
   */
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

  /**
   * Géocoder tous les agents sans coordonnées
   */
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

  /**
   * Mettre à jour les coordonnées d'un agent
   */
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

  /**
   * Trouver les agents sans coordonnées GPS
   */
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

  /**
   * Trouver les agents avec coordonnées GPS
   */
  async findWithCoordinates(): Promise<Agent[]> {
    return this.agentModel.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    }).exec();
  }

  /**
   * Obtenir les statistiques de géocodage
   */
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
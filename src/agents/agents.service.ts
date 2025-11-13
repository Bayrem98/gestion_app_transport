import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent } from './schemas/agent.schema';

@Injectable()
export class AgentsService {
  constructor(@InjectModel(Agent.name) private agentModel: Model<Agent>) {}

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
    return agent.save();
  }

  async update(id: string, agentData: Partial<Agent>): Promise<Agent> {
    const agent = await this.agentModel
      .findByIdAndUpdate(id, agentData, { new: true })
      .exec();
    if (!agent) {
      throw new NotFoundException('Agent non trouvé');
    }
    return agent;
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
}
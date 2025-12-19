import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Societe, SocieteDocument } from './schemas/societe.schema';

@Injectable()
export class SocieteService {
  constructor(
    @InjectModel(Societe.name) private societeModel: Model<SocieteDocument>,
  ) {}

  async findAll(): Promise<Societe[]> {
    return this.societeModel.find().sort({ nom: 1 }).exec();
  }

  async create(societeData: Partial<Societe>): Promise<Societe> {
    const createdSociete = new this.societeModel(societeData);
    return await createdSociete.save();
  }

  async findOne(id: string): Promise<Societe> {
    const societe = await this.societeModel.findById(id).exec();
    if (!societe) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`);
    }
    return societe;
  }

  async findByName(nom: string): Promise<Societe[]> {
    return this.societeModel.find({
      nom: { $regex: nom, $options: 'i' }
    }).exec();
  }

  async update(id: string, societeData: Partial<Societe>): Promise<Societe> {
    const updatedSociete = await this.societeModel
      .findByIdAndUpdate(
        id,
        { ...societeData, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
      .exec();
    
    if (!updatedSociete) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`);
    }
    return updatedSociete;
  }

  async delete(id: string): Promise<void> {
    const result = await this.societeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`);
    }
  }

  async search(query: string): Promise<Societe[]> {
    return this.societeModel.find({
      $or: [
        { nom: { $regex: query, $options: 'i' } },
        { adresse: { $regex: query, $options: 'i' } },
        { telephone: { $regex: query, $options: 'i' } }
      ]
    }).exec();
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chauffeur } from './schemas/chauffeur.schema';
import { Model } from 'mongoose';

@Injectable()
export class ChauffeursService {
     constructor(@InjectModel(Chauffeur.name) private chauffeurModel: Model<Chauffeur>) {}
    
      async findAll(): Promise<Chauffeur[]> {
        return this.chauffeurModel.find().exec();
      }
    
      async findOne(id: string): Promise<Chauffeur> {
        const chauffeur = await this.chauffeurModel.findById(id).exec();
        if (!chauffeur) {
          throw new NotFoundException('Chauffeur non trouvé');
        }
        return chauffeur;
      }
    
      async findByNom(nom: string): Promise<Chauffeur | null> {
        return this.chauffeurModel.findOne({ nom }).exec();
      }
    
      async create(chaffeurData: Partial<Chauffeur>): Promise<Chauffeur> {
        const chauffeur = new this.chauffeurModel(chaffeurData);
        return chauffeur.save();
      }
    
      async update(id: string, chauffeurData: Partial<Chauffeur>): Promise<Chauffeur> {
        const chauffeur = await this.chauffeurModel
          .findByIdAndUpdate(id, chauffeurData, { new: true })
          .exec();
        if (!chauffeur) {
          throw new NotFoundException('Chauffeur non trouvé');
        }
        return chauffeur;
      }
    
      async delete(id: string): Promise<void> {
        const result = await this.chauffeurModel.findByIdAndDelete(id).exec();
        if (!result) {
          throw new NotFoundException('Chauffeur non trouvé');
        }
      }
}

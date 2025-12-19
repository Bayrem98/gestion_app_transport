import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from 'src/app.module';
import { Agent } from './schemas/agent.schema';
import { Societe } from 'src/societe/schemas/societe.schema';

async function migrateAgents() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const agentModel = app.get<Model<Agent>>(getModelToken(Agent.name));
  const societeModel = app.get<Model<Societe>>(getModelToken(Societe.name));
  
  try {
    console.log('🚀 Début de la migration des agents...');
    
    // Récupérer tous les agents avec société comme string
    const agents = await agentModel.find({
      societe: { $type: 'string' }
    }).exec();
    
    console.log(`📊 ${agents.length} agents à migrer`);
    
    let success = 0;
    let errors = 0;
    
    for (const agent of agents) {
      try {
        const societeNom = agent.societe as unknown as string;
        
        if (!societeNom || societeNom === 'Non') {
          console.log(`⚠️  Agent ${agent.nom} n'a pas de société valide`);
          continue;
        }
        
        // Chercher la société par nom
        let societe = await societeModel.findOne({ nom: societeNom }).exec();
        
        if (!societe) {
          // Créer la société si elle n'existe pas
          societe = await societeModel.create({
            nom: societeNom,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`✅ Société créée: ${societeNom}`);
        }
        
        // Mettre à jour l'agent avec l'ObjectId
        await agentModel.updateOne(
          { _id: agent._id },
          { societe: societe._id }
        ).exec();
        
        success++;
        console.log(`✅ Agent migré: ${agent.nom} -> ${societeNom}`);
        
      } catch (error) {
        errors++;
        console.error(`❌ Erreur agent ${agent.nom}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration terminée!`);
    console.log(`✅ Succès: ${success}`);
    console.log(`❌ Erreurs: ${errors}`);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

migrateAgents();
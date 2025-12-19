import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AffectationsModule } from './affectations/affectations.module';
import { PlanningModule } from './planning/planning.module';
import { ChauffeursModule } from './chauffeurs/chauffeurs.module';
import { AdminuserModule } from './loginModule/adminuser/adminuser.module';
import { SupadminModule } from './loginModule/supadmin/supadmin.module';
import { UserModule } from './loginModule/user/user.module';
import { AuthModule } from './loginModule/auth/auth.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { AgentsModule } from './agents/agents.module';
import { SocieteModule } from './societe/societe.module';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.gjbdf3j.mongodb.net/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`,
    ),
    SocieteModule,
    AgentsModule,
    AffectationsModule,
    PlanningModule,
    ChauffeursModule,
    AdminuserModule,
    SupadminModule,
    UserModule,
    AuthModule,
    GeocodingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
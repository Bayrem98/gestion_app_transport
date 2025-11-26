import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { AffectationsModule } from './affectations/affectations.module';
import { PlanningModule } from './planning/planning.module';
import { StatistiquesModule } from './statistiques/statistiques.module';
import { ChauffeursModule } from './chauffeurs/chauffeurs.module';
import { AdminuserController } from './loginModule/adminuser/adminuser.controller';
import { AdminuserService } from './loginModule/adminuser/adminuser.service';
import { AdminuserModule } from './loginModule/adminuser/adminuser.module';
import { SupadminController } from './loginModule/supadmin/supadmin.controller';
import { SupadminService } from './loginModule/supadmin/supadmin.service';
import { SupadminModule } from './loginModule/supadmin/supadmin.module';
import { UserController } from './loginModule/user/user.controller';
import { UserService } from './loginModule/user/user.service';
import { UserModule } from './loginModule/user/user.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.gjbdf3j.mongodb.net/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`,
    ),
    AgentsModule,
    AffectationsModule,
    PlanningModule,
    ChauffeursModule,
    AdminuserModule,
    SupadminModule,
    UserModule,
    AuthModule,
    // StatistiquesModule,
  ],
  controllers: [AdminuserController, SupadminController, UserController, AuthController],
  providers: [AdminuserService, SupadminService, UserService, AuthService],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { CurrentUserInterceptor } from './user.interceptor';
import { LocalStrategy } from './local.strategy';
import { SupadminModule } from '../supadmin/supadmin.module';
import { AdminuserModule } from '../adminuser/adminuser.module';
import { UserModule } from '../user/user.module';

export const jwtConstants = {
  secret: 'g§ueve45u§eyvZeicne',
};

@Module({
  imports: [
    SupadminModule,
    AdminuserModule,
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, CurrentUserInterceptor],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

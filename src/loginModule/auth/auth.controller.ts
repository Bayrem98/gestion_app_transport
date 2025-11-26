import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUserInterceptor } from './user.interceptor';
import { LoginAuthDto } from './dto/login-auth.dto';
import { LoginAdAuthDto } from './dto/loginA-auth.dto';
import { LoginSupadminAuthDto } from './dto/loginSupAdmin-auth.dto';
import { Supadmin, SupadminWithoutPassword } from '../supadmin/supadmin.interface';
import { User, UserWithoutPassword } from '../user/user.interface';
import { Adminuser, AdminuserWithoutPassword } from '../adminuser/adminuser.interface';
import CreateAdminuserDto from '../adminuser/dto/create-adminuser.dto';
import CreateSupadminDto from '../supadmin/dto/create-supadmin.dto';
import CreateUserDto from '../user/dto/create-user.dto';

@Controller('auth')
@UseInterceptors(CurrentUserInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('mesup')
  async mesup(@Request() req): Promise<SupadminWithoutPassword | null | undefined> {
    console.log(req.user);
    return this.authService.getMes(req.user);
  }

  @Get('me')
  async me(@Request() req): Promise<UserWithoutPassword | null | undefined> {
    console.log(req.user);
    return this.authService.getMe(req.user);
  }

  @Get('mea')
  async mea(@Request() req): Promise<AdminuserWithoutPassword | null | undefined> {
    console.log(req.user);
    return this.authService.getMea(req.user);
  }

  @Post('registersup')
  async registersup(@Body() newSupadmin: CreateSupadminDto): Promise<SupadminWithoutPassword> {
    return this.authService.registersup(newSupadmin);
  }

  @Post('register')
  async register(@Body() newUser: CreateUserDto): Promise<UserWithoutPassword> {
    return this.authService.register(newUser);
  }

  @Post('registera')
  async registera(
    @Body() newAdminuser: CreateAdminuserDto,
  ): Promise<AdminuserWithoutPassword> {
    return this.authService.registera(newAdminuser);
  }

  @Post('loginsup')
  async loginsup(@Body() loginDto: LoginSupadminAuthDto) {
    return this.authService.loginsup(loginDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginAuthDto) {
    return this.authService.login(loginDto);
  }

  @Post('logina')
  async logina(@Body() loginADto: LoginAdAuthDto) {
    return this.authService.logina(loginADto);
  }
}
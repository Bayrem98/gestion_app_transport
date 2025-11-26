import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginAuthDto } from './dto/login-auth.dto';
import { LoginAdAuthDto } from './dto/loginA-auth.dto';
import { LoginSupadminAuthDto } from './dto/loginSupAdmin-auth.dto';
import { UserService } from '../user/user.service';
import { AdminuserService } from '../adminuser/adminuser.service';
import { SupadminService } from '../supadmin/supadmin.service';
import CreateSupadminDto from '../supadmin/dto/create-supadmin.dto';
import CreateUserDto from '../user/dto/create-user.dto';
import CreateAdminuserDto from '../adminuser/dto/create-adminuser.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private adminuserService: AdminuserService,
    private supadminService: SupadminService,
    private jwtService: JwtService,
  ) {}

  async getMes(supadmin: any) {
    console.log(supadmin);
    if (supadmin) return this.supadminService.findOne(supadmin);
    else throw new HttpException('I dont know you!', HttpStatus.NOT_FOUND);
  }

  async getMe(user: any) {
    console.log(user);
    if (user) return this.userService.findOne(user);
    else throw new HttpException('I dont know you!', HttpStatus.NOT_FOUND);
  }

  async getMea(adminuser: any) {
    console.log(adminuser);
    if (adminuser) return this.adminuserService.findOne(adminuser);
    else throw new HttpException('I dont know you!', HttpStatus.NOT_FOUND);
  }

  async validateUserSup(username: string, pass: string): Promise<any> {
    const user = await this.supadminService.findOneByUsername(username);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const isPassMatching = await bcrypt.compare(pass, user.password);
    if (user && isPassMatching) {
      // Créer une copie de l'utilisateur sans le mot de passe
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    throw new HttpException(
      'Wrong credentials provided',
      HttpStatus.BAD_REQUEST,
    );
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findOneByUsername(username);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const isPassMatching = await bcrypt.compare(pass, user.password);
    if (user && isPassMatching) {
      // Créer une copie de l'utilisateur sans le mot de passe
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    throw new HttpException(
      'Wrong credentials provided',
      HttpStatus.BAD_REQUEST,
    );
  }

  async validateUserA(username: string, pass: string): Promise<any> {
    const user = await this.adminuserService.findOneByUsername(username);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const isPassMatching = await bcrypt.compare(pass, user.password);
    if (user && isPassMatching) {
      // Créer une copie de l'utilisateur sans le mot de passe
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    throw new HttpException(
      'Wrong credentials provided',
      HttpStatus.BAD_REQUEST,
    );
  }

  public async registersup(registrationData: CreateSupadminDto) {
    const user = await this.supadminService.findOneByUsername(
      registrationData.username,
    );
    if (user) {
      throw new HttpException('Username already used', HttpStatus.BAD_REQUEST);
    }
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    try {
      const createdUser = await this.supadminService.create({
        ...registrationData,
        password: hashedPassword,
      });
      // Créer une copie sans le mot de passe
      const { password, ...userWithoutPassword } = createdUser;
      return userWithoutPassword;
    } catch (error) {
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async register(registrationData: CreateUserDto) {
    const user = await this.userService.findOneByUsername(
      registrationData.username,
    );
    if (user) {
      throw new HttpException('Username already used', HttpStatus.BAD_REQUEST);
    }
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    try {
      const createdUser = await this.userService.create({
        ...registrationData,
        password: hashedPassword,
      });
      // Créer une copie sans le mot de passe
      const { password, ...userWithoutPassword } = createdUser;
      return userWithoutPassword;
    } catch (error) {
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async registera(registrationData: CreateAdminuserDto) {
    const user = await this.adminuserService.findOneByUsername(
      registrationData.username,
    );
    if (user) {
      throw new HttpException('Username already used', HttpStatus.BAD_REQUEST);
    }
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    try {
      const createdUser = await this.adminuserService.create({
        ...registrationData,
        password: hashedPassword,
      });
      // Créer une copie sans le mot de passe
      const { password, ...userWithoutPassword } = createdUser;
      return userWithoutPassword;
    } catch (error) {
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async loginsup(loginDto: LoginSupadminAuthDto) {
    const { password, username } = loginDto;
    const found = await this.supadminService.findOneByUsername(username);
    if (!found) {
      throw new UnauthorizedException("Nom d'utilisateur est incorrect !");
    }

    const isPasswordValid = await bcrypt.compare(password, found.password);
    console.log('Password validation result:', isPasswordValid);

    if (isPasswordValid) {
      // Créer une copie sans le mot de passe pour la réponse
      const { password: _, ...userWithoutPassword } = found;
      return {
        token: this.jwtService.sign({ username: username }),
        user: userWithoutPassword,
      };
    } else {
      console.log('mot de passe errone');
      throw new ConflictException(`Votre mot de passe est incorrect !`);
    }
  }

  async login(loginDto: LoginAuthDto) {
    const { password, username } = loginDto;
    const found = await this.userService.findOneByUsername(username);
    if (!found) {
      throw new UnauthorizedException("Nom d'utilisateur est incorrect !");
    }

    const isPasswordValid = await bcrypt.compare(password, found.password);
    console.log('Password validation result:', isPasswordValid);

    if (isPasswordValid) {
      // Créer une copie sans le mot de passe pour la réponse
      const { password: _, ...userWithoutPassword } = found;
      return {
        token: this.jwtService.sign({ username: username }),
        user: userWithoutPassword,
      };
    } else {
      console.log('mot de passe errone');
      throw new ConflictException(`Votre mot de passe est incorrect !`);
    }
  }

  async logina(loginDto: LoginAdAuthDto) {
    const { password, username } = loginDto;
    const found = await this.adminuserService.findOneByUsername(username);
    if (!found) {
      throw new UnauthorizedException("Nom d'utilisateur est incorrect !");
    }

    const isPasswordValid = await bcrypt.compare(password, found.password);
    console.log('Password validation result:', isPasswordValid);

    if (isPasswordValid) {
      // Créer une copie sans le mot de passe pour la réponse
      const { password: _, ...userWithoutPassword } = found;
      return {
        token: this.jwtService.sign({ username: username }),
        user: userWithoutPassword,
      };
    } else {
      console.log('mot de passe errone');
      throw new ConflictException(`Votre mot de passe est incorrect !`);
    }
  }
}
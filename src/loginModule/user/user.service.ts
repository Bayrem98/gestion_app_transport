import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model, Types } from 'mongoose';
import CreateUserDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOne(_id: string): Promise<User | null> {
    return await this.userModel.findOne({ _id }).select('-password').exec();
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find().select('-password').exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.findOneByUsername(createUserDto.username);
    if (user)
      throw new HttpException('Username already used', HttpStatus.BAD_REQUEST);
    const createdUser = new this.userModel(createUserDto);
    createdUser.password = await bcrypt.hash(createdUser.password, 10);
    return createdUser.save();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise</*UpdateResult*/ any> {
    if (updateUserDto.password)
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    return this.userModel.updateOne({ _id: id }, updateUserDto);
  }

  async delete(id: string): Promise</*DeleteResult*/ any> {
    return this.userModel.deleteOne({ _id: id });
  }

}

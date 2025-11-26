import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Adminuser, AdminuserDocument } from './schemas/adminuser.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import CreateAdminuserDto from './dto/create-adminuser.dto';
import UpdateAdminuserDto from './dto/update-adminuser.dto';

@Injectable()
export class AdminuserService {
  constructor(
    @InjectModel(Adminuser.name)
    private adminuserModel: Model<AdminuserDocument>,
  ) {}

  async findOne(_id: string): Promise<Adminuser | null> {
    return await this.adminuserModel
      .findOne({ _id })
      .select('-password')
      .exec();
  }

  async findOneByUsername(username: string): Promise<Adminuser | null> {
    return this.adminuserModel.findOne({ username }).exec();
  }

  async findAll(): Promise<Adminuser[]> {
    return await this.adminuserModel.find().select('-password').exec();
  }

  async create(createAdminuserDto: CreateAdminuserDto): Promise<Adminuser> {
    const user = await this.findOneByUsername(createAdminuserDto.username);
    if (user)
      throw new HttpException('Username already used', HttpStatus.BAD_REQUEST);
    const createdUser = new this.adminuserModel(createAdminuserDto);
    createdUser.password = await bcrypt.hash(createdUser.password, 10);
    return createdUser.save();
  }

  async update(
    id: string,
    updateAdminuserDto: UpdateAdminuserDto,
  ): Promise</*UpdateResult*/ any> {
    if (updateAdminuserDto.password)
      updateAdminuserDto.password = await bcrypt.hash(
        updateAdminuserDto.password,
        10,
      );
    return this.adminuserModel.updateOne({ _id: id }, updateAdminuserDto);
  }

  async delete(id: string): Promise</*DeleteResult*/ any> {
    return this.adminuserModel.deleteOne({ _id: id });
  }
}

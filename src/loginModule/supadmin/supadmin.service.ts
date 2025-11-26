import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Supadmin, SupadminDocument } from './schemas/supadmin.schema';
import { Model } from 'mongoose';
import CreateSupadminDto from './dto/create-supadmin.dto';
import UpdateSupadminDto from './dto/update-supadmin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SupadminService {
  constructor(
    @InjectModel(Supadmin.name)
    private supadminModel: Model<SupadminDocument>,
  ) {}

  async findOne(_id: string): Promise<Supadmin | null> {
    return await this.supadminModel.findOne({ _id }).select('-password').exec();
  }

  async findOneByUsername(username: string): Promise<Supadmin | null> {
    return this.supadminModel.findOne({ username }).exec();
  }

  async findAll(): Promise<Supadmin[]> {
    return await this.supadminModel.find().select('-password').exec();
  }

  async create(createSupadminDto: CreateSupadminDto): Promise<Supadmin> {
    const user = await this.findOneByUsername(createSupadminDto.username);
    if (user)
      throw new HttpException('Username already used', HttpStatus.BAD_REQUEST);
    const createdUser = new this.supadminModel(createSupadminDto);
    createdUser.password = await bcrypt.hash(createdUser.password, 10);
    return createdUser.save();
  }

  async update(
    id: string,
    updateSupadminDto: UpdateSupadminDto,
  ): Promise</*UpdateResult*/ any> {
    if (updateSupadminDto.password)
      updateSupadminDto.password = await bcrypt.hash(
        updateSupadminDto.password,
        10,
      );
    return this.supadminModel.updateOne({ _id: id }, updateSupadminDto);
  }

  async delete(id: string): Promise</*DeleteResult*/ any> {
    return this.supadminModel.deleteOne({ _id: id });
  }
}

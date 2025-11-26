import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Supadmin } from './supadmin.interface';
import CreateSupadminDto from './dto/create-supadmin.dto';
import { SupadminService } from './supadmin.service';
import UpdateSupadminDto from './dto/update-supadmin.dto';

@Controller('supadmin')
export class SupadminController {
  constructor(private readonly supadminService: SupadminService) {}

  @Get(':id')
  findOne(@Param('id') _id: string) {
    return this.supadminService.findOne(_id);
  }

  @Get()
  findAll() {
    return this.supadminService.findAll();
  }

  @Post()
  create(@Body() createSupadminDto: CreateSupadminDto): Promise<Supadmin> {
    return this.supadminService.create(createSupadminDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateSupadminDto: UpdateSupadminDto,
  ): Promise<Supadmin> {
    return this.supadminService.update(id, updateSupadminDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.supadminService.delete(id);
  }
}

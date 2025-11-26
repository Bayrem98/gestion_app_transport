import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AdminuserService } from './adminuser.service';
import CreateAdminuserDto from './dto/create-adminuser.dto';
import { Adminuser } from './adminuser.interface';
import UpdateAdminuserDto from './dto/update-adminuser.dto';

@Controller('adminuser')
export class AdminuserController {
  constructor(private readonly adminuserService: AdminuserService) {}

  @Get(':id')
  findOne(@Param('id') _id: string) {
    return this.adminuserService.findOne(_id);
  }

  @Get()
  findAll() {
    return this.adminuserService.findAll();
  }

  @Post()
  create(@Body() createAdminuserDto: CreateAdminuserDto): Promise<Adminuser> {
    return this.adminuserService.create(createAdminuserDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAdminuserDto: UpdateAdminuserDto,
  ): Promise<Adminuser> {
    return this.adminuserService.update(id, updateAdminuserDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.adminuserService.delete(id);
  }
}

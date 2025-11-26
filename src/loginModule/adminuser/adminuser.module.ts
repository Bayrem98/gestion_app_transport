import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminuserSchema } from './schemas/adminuser.schema';
import { AdminuserController } from './adminuser.controller';
import { AdminuserService } from './adminuser.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Adminuser', schema: AdminuserSchema }]),
  ],
  controllers: [AdminuserController],
  providers: [AdminuserService],
  exports: [AdminuserService],
})
export class AdminuserModule {}

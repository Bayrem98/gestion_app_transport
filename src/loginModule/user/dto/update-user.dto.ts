import { IsMongoId, IsOptional } from 'class-validator';

export default class UpdateUserDto {
  @IsMongoId()
  @IsOptional()
  _id?: string;
  @IsOptional()
  username?: string;
  @IsOptional()
  password?: string;
}

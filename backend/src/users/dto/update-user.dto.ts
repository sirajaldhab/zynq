import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ALLOWED_STATUSES } from './create-user.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsIn(ALLOWED_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

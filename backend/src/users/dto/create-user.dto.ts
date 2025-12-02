import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'REJECTED'];

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  roleId!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsIn(ALLOWED_STATUSES)
  status?: string;
}

export { ALLOWED_STATUSES };

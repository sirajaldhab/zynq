import { IsUUID } from 'class-validator';

export class LogoutDto {
  @IsUUID()
  refreshToken!: string;
}

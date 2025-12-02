import { IsUUID } from 'class-validator';

export class RefreshDto {
  @IsUUID()
  refreshToken!: string;
}

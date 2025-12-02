import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ALLOWED_STATUSES } from './create-user.dto';

const ALLOWED_STATUS_FILTERS = [...ALLOWED_STATUSES, 'All'] as const;

type StatusFilter = (typeof ALLOWED_STATUS_FILTERS)[number];

export class ListUsersQueryDto {
  @Transform(({ value }) => (value === undefined ? 1 : Number(value)))
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) => (value === undefined ? 20 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  role?: string;

  @IsOptional()
  @IsIn(ALLOWED_STATUS_FILTERS)
  status?: StatusFilter;
}

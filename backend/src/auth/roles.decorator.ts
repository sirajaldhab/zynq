import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type AppRole =
  | 'ADMIN'
  | 'GM'
  | 'HR_MANAGER'
  | 'FINANCE_MANAGER'
  | 'PROJECT_MANAGER'
  | 'MANAGER'
  | 'ACCOUNTANT'
  | 'RECORDER';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

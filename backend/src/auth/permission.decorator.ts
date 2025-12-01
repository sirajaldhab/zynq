import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const Permission = (key: string) => SetMetadata(PERMISSION_KEY, key);

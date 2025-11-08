export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'STAFF';
export interface JwtPayload {
    sub: string;
    email: string;
    role: RoleName;
}

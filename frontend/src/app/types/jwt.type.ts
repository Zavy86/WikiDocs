import type { JwtContract } from '@shared/contracts';

export type JwtType = {
  jwt:string;
};

type JwtShapeGuard = [ JwtContract ] extends [ JwtType ]
  ? [ JwtType ] extends [ JwtContract ] ? true : never : never;
const jwtShapeGuard:JwtShapeGuard = true;
void jwtShapeGuard;

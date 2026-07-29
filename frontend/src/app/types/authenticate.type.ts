import type { AuthenticateContract } from '@shared/contracts';

export type AuthenticateType = {
  account:string;
  password:string;
  duration?:number;
};

type AuthenticateShapeGuard = [ AuthenticateContract ] extends [ AuthenticateType ]
  ? [ AuthenticateType ] extends [ AuthenticateContract ] ? true : never : never;
const authenticateShapeGuard:AuthenticateShapeGuard = true;
void authenticateShapeGuard;

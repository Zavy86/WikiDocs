import type { TokenContract } from '@shared/contracts';

export type TokenType = {
  duration:number;
  generation:string;
  expiration:string;
  account:string;
  firstname:string;
  lastname:string;
  role:string;
  authorizations:string[];
};

type TokenShapeGuard = [ TokenContract ] extends [ TokenType ]
  ? [ TokenType ] extends [ TokenContract ] ? true : never : never;
const tokenShapeGuard:TokenShapeGuard = true;
void tokenShapeGuard;

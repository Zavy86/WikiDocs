import type { AccountContract } from '@shared/contracts';

export type AccountType = {
  account:string;
  firstname:string;
  lastname:string;
  role:'administrator' | 'author' | 'user';
  password?:null | string;
};

type AccountShapeGuard = [ AccountContract ] extends [ AccountType ]
  ? [ AccountType ] extends [ AccountContract ] ? true : never : never;
const accountShapeGuard:AccountShapeGuard = true;
void accountShapeGuard;

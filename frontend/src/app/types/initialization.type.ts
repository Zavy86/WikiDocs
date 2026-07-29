import type { InitializationContract } from '@shared/contracts';

export type InitializationType = {
  title:string;
  account:string;
  firstname:string;
  lastname:string;
  password:null | string;
};

type InitializationShapeGuard = [ InitializationContract ] extends [ InitializationType ]
  ? [ InitializationType ] extends [ InitializationContract ] ? true : never : never;
const initializationShapeGuard:InitializationShapeGuard = true;
void initializationShapeGuard;

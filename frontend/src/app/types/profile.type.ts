import type { ProfileContract } from '@shared/contracts';

export type ProfileType = {
  firstname:string;
  lastname:string;
  password?:null | string;
};

type ProfileShapeGuard = [ ProfileContract ] extends [ ProfileType ]
  ? [ ProfileType ] extends [ ProfileContract ] ? true : never : never;
const profileShapeGuard:ProfileShapeGuard = true;
void profileShapeGuard;

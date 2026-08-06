import type { ReleaseContract } from '@shared/contracts';

export type ReleaseType = {
  current:string;
  latest:string;
};

type ReleaseShapeGuard = [ ReleaseContract ] extends [ ReleaseType ]
  ? [ ReleaseType ] extends [ ReleaseContract ] ? true : never : never;
const releaseShapeGuard:ReleaseShapeGuard = true;
void releaseShapeGuard;

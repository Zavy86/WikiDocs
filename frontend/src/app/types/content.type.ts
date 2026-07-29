import type { ContentContract } from '@shared/contracts';

export type ContentType = {
  raw:string;
};

type ContentShapeGuard = [ ContentContract ] extends [ ContentType ]
  ? [ ContentType ] extends [ ContentContract ] ? true : never : never;
const contentShapeGuard:ContentShapeGuard = true;
void contentShapeGuard;

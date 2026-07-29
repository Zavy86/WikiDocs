import type { MetadataContract } from '@shared/contracts';

export type MetadataType = {
  path:string;
  title:string;
  timestamp:string;
  author:string;
  tags:string[];
};

type MetadataShapeGuard = [ MetadataContract ] extends [ MetadataType ]
  ? [ MetadataType ] extends [ MetadataContract ] ? true : never : never;
const metadataShapeGuard:MetadataShapeGuard = true;
void metadataShapeGuard;

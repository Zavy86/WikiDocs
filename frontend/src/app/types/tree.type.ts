import type { TreeContract } from '@shared/contracts';
import { MetadataType } from 'src/app/types/metadata.type';

export type TreeType = {
  metadata:MetadataType;
  leaves:MetadataType[];
};

type TreeShapeGuard = [ TreeContract ] extends [ TreeType ]
  ? [ TreeType ] extends [ TreeContract ] ? true : never : never;
const treeShapeGuard:TreeShapeGuard = true;
void treeShapeGuard;

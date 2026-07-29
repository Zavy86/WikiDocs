import type { TrashContract } from '@shared/contracts';
import { MetadataType } from 'src/app/types/metadata.type';

export type TrashType = {
  documents:MetadataType[];
};

type TrashShapeGuard = [ TrashContract ] extends [ TrashType ]
  ? [ TrashType ] extends [ TrashContract ] ? true : never : never;
const trashShapeGuard:TrashShapeGuard = true;
void trashShapeGuard;

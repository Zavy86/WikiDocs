import type { PinnedContract } from '@shared/contracts';
import { MetadataType } from 'src/app/types/metadata.type';

export type PinnedType = {
  documents:MetadataType[];
};

type PinnedShapeGuard = [ PinnedContract ] extends [ PinnedType ]
  ? [ PinnedType ] extends [ PinnedContract ] ? true : never : never;
const pinnedShapeGuard:PinnedShapeGuard = true;
void pinnedShapeGuard;

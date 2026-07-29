import type { SearchContract } from '@shared/contracts';
import { MetadataType } from 'src/app/types/metadata.type';

export type SearchResultType = {
  metadata:MetadataType;
  highlights:string[];
};

export type SearchType = {
  results:SearchResultType[];
};

type SearchShapeGuard = [ SearchContract ] extends [ SearchType ]
  ? [ SearchType ] extends [ SearchContract ] ? true : never : never;
const searchShapeGuard:SearchShapeGuard = true;
void searchShapeGuard;

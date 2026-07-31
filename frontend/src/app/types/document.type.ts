import type { DocumentContract } from '@shared/contracts';
import { AttachmentType } from 'src/app/types/attachment.type';
import { ContentType } from 'src/app/types/content.type';
import { MetadataType } from 'src/app/types/metadata.type';

export type DocumentType = {
  exists:boolean;
  pinned:boolean;
  metadata:MetadataType;
  children:MetadataType[];
  attachments:AttachmentType[];
  versions:string[];
  content:ContentType;
};

type DocumentShapeGuard = [ DocumentContract ] extends [ DocumentType ]
  ? [ DocumentType ] extends [ DocumentContract ] ? true : never : never;
const documentShapeGuard:DocumentShapeGuard = true;
void documentShapeGuard;

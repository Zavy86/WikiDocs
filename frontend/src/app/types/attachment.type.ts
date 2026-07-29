import type { AttachmentContract } from '@shared/contracts';

export type AttachmentType = {
  path:string;
  file:string;
  token:string;
};

type AttachmentShapeGuard = [ AttachmentContract ] extends [ AttachmentType ]
  ? [ AttachmentType ] extends [ AttachmentContract ] ? true : never : never;
const attachmentShapeGuard:AttachmentShapeGuard = true;
void attachmentShapeGuard;

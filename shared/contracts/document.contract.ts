import { AttachmentContract } from "./attachment.contract";
import { ContentContract } from "./content.contract";
import { MetadataContract } from "./metadata.contract";

export type DocumentContract = {
  exists:boolean;
  pinned:boolean;
  metadata:MetadataContract;
  children:MetadataContract[];
  attachments:AttachmentContract[];
  versions:string[];
  content:ContentContract;
};

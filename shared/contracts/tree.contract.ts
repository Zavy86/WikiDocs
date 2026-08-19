import { MetadataContract } from "./metadata.contract";

export type TreeContract = {
  metadata:MetadataContract;
  leaves:MetadataContract[];
};

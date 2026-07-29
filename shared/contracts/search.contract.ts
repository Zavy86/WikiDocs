import { MetadataContract } from "./metadata.contract";

export type SearchContract = {
  results:{
    metadata:MetadataContract,
    highlights:string[]
  }[];
};

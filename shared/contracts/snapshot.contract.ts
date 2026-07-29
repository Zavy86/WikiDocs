export type SnapshotContract = {
  timestamp:string;
  documents:{
    path:string;
    time:number;
  }[];
};

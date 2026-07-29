export type InformationContract = {
  mode:'local' | 'private' | 'public';
  initialized:boolean;
  service:string;
  version:string;
  host:string;
  platform:string;
  engine:string;
  pid:number;
  uptime:number;
  memory:number;
};

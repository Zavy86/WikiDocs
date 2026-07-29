import type { InformationContract } from '@shared/contracts';

export type InformationType = {
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

type InformationShapeGuard = [ InformationContract ] extends [ InformationType ]
  ? [ InformationType ] extends [ InformationContract ] ? true : never : never;
const informationShapeGuard:InformationShapeGuard = true;
void informationShapeGuard;

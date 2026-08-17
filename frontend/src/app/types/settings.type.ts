import type { SettingsContract } from '@shared/contracts';

export type SettingsType = {
  title:string;
  subtitle:string;
  owner:string;
  notice:string;
  privacy:string | null;
  localization:'cs' | 'de' | 'en' | 'es' | 'it';
  timezone:string;
  template:'light' | 'dark';
  color:string;
};

type SettingsShapeGuard = [ SettingsContract ] extends [ SettingsType ]
  ? [ SettingsType ] extends [ SettingsContract ] ? true : never : never;
const settingsShapeGuard:SettingsShapeGuard = true;
void settingsShapeGuard;

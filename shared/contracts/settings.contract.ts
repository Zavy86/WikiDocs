export type SettingsContract = {
  title:string;
  subtitle:string;
  owner:string;
  notice:string;
  privacy:string | null;
  localization:'cs' | 'en' | 'it';
  timezone:string;
  template:'light' | 'dark';
  color:string;
};

export type SettingsContract = {
  title:string;
  subtitle:string;
  owner:string;
  notice:string;
  privacy:string | null;
  localization:'cs' | 'de' | 'en' | 'es' | 'fa' | 'fr' | 'it';
  timezone:string;
  template:'light' | 'dark';
  color:string;
};

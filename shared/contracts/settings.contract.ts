export type SettingsContract = {
  title:string;
  subtitle:string;
  owner:string;
  notice:string;
  privacy:string | null;
  localization:'en' | 'it';
  timezone:string;
  template:'light' | 'dark';
  color:string;
};

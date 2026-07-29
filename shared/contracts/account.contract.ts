export type AccountContract = {
  account:string;
  firstname:string;
  lastname:string;
  role:'administrator' | 'author' | 'user';
  password?:null | string;
};

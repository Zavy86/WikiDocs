import type { AccountsContract } from '@shared/contracts';
import { AccountType } from 'src/app/types/account.type';

export type AccountsType = {
  accounts:AccountType[];
};

type AccountsShapeGuard = [ AccountsContract ] extends [ AccountsType ]
  ? [ AccountsType ] extends [ AccountsContract ] ? true : never : never;
const accountsShapeGuard:AccountsShapeGuard = true;
void accountsShapeGuard;

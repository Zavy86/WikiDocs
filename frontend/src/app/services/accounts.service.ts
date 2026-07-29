import { map, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AccountsType, AccountType } from 'src/app/types';
import { HttpService } from 'src/app/services/http.service';

@Injectable({ providedIn: 'root' })
export class AccountsService {

  constructor(
    private httpService:HttpService,
  ) {}

  public retrieve():Observable<ReadonlyArray<AccountType>> {
    return this.httpService.GET<AccountsType>('/accounts')
      .pipe(map((response:AccountsType):ReadonlyArray<AccountType> => [ ...response.accounts ]));
  }

  public upsert(account:AccountType):Observable<void> {
    return this.store([ account ]);
  }

  public store(accounts:ReadonlyArray<AccountType>):Observable<void> {
    const request:AccountsType = { accounts: [ ...accounts ] };
    return this.httpService.POST<void>('/accounts', request);
  }

  public remove(account:string):Observable<void> {
    return this.httpService.DELETE<void>(`/accounts?account=${ encodeURIComponent(account) }`);
  }

}

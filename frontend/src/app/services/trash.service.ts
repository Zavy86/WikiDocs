import { map, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { MetadataType, TrashType } from 'src/app/types';
import { HttpService } from 'src/app/services/http.service';

@Injectable({ providedIn: 'root' })
export class TrashService {

  constructor(
    private readonly httpService:HttpService,
  ) {}

  public retrieve():Observable<ReadonlyArray<MetadataType>> {
    return this.httpService.GET<TrashType>('/trash')
      .pipe(map((response:TrashType):ReadonlyArray<MetadataType> => [ ...response.documents ]));
  }

  public recover(path:string, destination:string):Observable<void> {
    return this.httpService.PATCH<void>(`/trash?path=${ encodeURIComponent(path) }&destination=${ encodeURIComponent(destination) }`);
  }

  public remove(path:string):Observable<void> {
    return this.httpService.DELETE<void>(`/trash?path=${ encodeURIComponent(path) }`);
  }

}

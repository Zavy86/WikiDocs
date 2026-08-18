import { Observable, tap } from 'rxjs';
import { computed, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { HttpService } from 'src/app/services/http.service';
import { ReleaseType } from 'src/app/types';

@Injectable({ providedIn: 'root' })
export class ReleaseService {

  private readonly releaseState:WritableSignal<ReleaseType | null> = signal<ReleaseType | null>(null);

  private readonly dismissedState:WritableSignal<boolean> = signal(false);

  public readonly release:Signal<ReleaseType | null> = this.releaseState.asReadonly();

  public readonly shouldShowDialog:Signal<boolean> = computed(():boolean => {
    const release:ReleaseType | null = this.releaseState();
    return release !== null && release.current !== release.latest && ! this.dismissedState();
  });

  constructor(
    private readonly httpService:HttpService
  ) {}

  public refresh(force:boolean = false):Observable<ReleaseType> {
    const uri:string = ( force ? '/release?force=true' : '/release' );
    return this.httpService.GET<ReleaseType>(uri).pipe(
      tap((release:ReleaseType):void => {
        if ( force ) { this.dismissedState.set(false); }
        this.releaseState.set(release);
      })
    );
  }

  public dismiss():void {
    this.dismissedState.set(true);
  }

}

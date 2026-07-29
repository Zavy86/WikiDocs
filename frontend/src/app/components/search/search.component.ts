import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { distinctUntilChanged, map } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';
import { HttpService } from 'src/app/services/http.service';
import { SearchResultType, SearchType } from 'src/app/types';

@Component({
  standalone: true,
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  imports: [ RouterLink, MarkdownComponent, MatProgressSpinnerModule ],
})
export class SearchComponent {
  private readonly route:ActivatedRoute = inject(ActivatedRoute);
  private readonly alertService:AlertService = inject(AlertService);
  private readonly httpService:HttpService = inject(HttpService);

  protected readonly query:WritableSignal<string> = signal('');
  protected readonly results:WritableSignal<ReadonlyArray<SearchResultType>> = signal<ReadonlyArray<SearchResultType>>([]);
  protected readonly loading:WritableSignal<boolean> = signal(false);

  private requestSequence:number = 0;

  public constructor() {
    this.route.queryParamMap.pipe(
      map((params):string => params.get('q')?.trim() ?? ''),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe((query:string):void => this.load(query));
  }

  private load(query:string):void {
    const requestId:number = ++this.requestSequence;
    this.query.set(query);
    this.results.set([]);
    if ( ! query ) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.httpService.GET<SearchType>(`/search?query=${ encodeURIComponent(query) }`).subscribe({
      next: (response:SearchType):void => {
        if ( requestId !== this.requestSequence ) { return; }
        this.results.set(response.results);
        this.loading.set(false);
      },
      error: (error:HttpErrorResponse):void => {
        if ( requestId !== this.requestSequence ) { return; }
        this.results.set([]);
        this.loading.set(false);
        this.alertService.error(error.message || 'Unable to search the wiki.');
      },
    });
  }

}

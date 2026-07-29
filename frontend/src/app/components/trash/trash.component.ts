import { finalize } from 'rxjs';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmComponent, ConfirmData } from 'src/app/components/confirm/confirm.component';
import { TreeComponent, TreeData } from 'src/app/components/tree/tree.component';
import { AlertService } from 'src/app/services/alert.service';
import { HttpService } from 'src/app/services/http.service';
import { TrashService } from 'src/app/services/trash.service';
import { MetadataType, SettingsType } from 'src/app/types';

type TrashEntry = {
  readonly metadata:MetadataType;
  readonly fileName:string;
  readonly deletedAt:Date | null;
};

type TrashPath = {
  readonly fileName:string;
  readonly deletedAt:Date | null;
};

@Component({
  standalone: true,
  selector: 'app-trash',
  templateUrl: './trash.component.html',
  styleUrl: './trash.component.scss',
  imports: [ DatePipe, MatButtonModule, MatIconModule, MatTooltipModule ],
})
export class TrashComponent {

  private readonly alertService:AlertService = inject(AlertService);
  private readonly dialog:MatDialog = inject(MatDialog);
  private readonly httpService:HttpService = inject(HttpService);
  private readonly trashService:TrashService = inject(TrashService);

  protected readonly loading:WritableSignal<boolean> = signal(true);
  protected readonly processing:WritableSignal<boolean> = signal(false);
  protected readonly timezone:WritableSignal<string | undefined> = signal<string | undefined>(undefined);
  private readonly documents:WritableSignal<ReadonlyArray<MetadataType>> = signal<ReadonlyArray<MetadataType>>([]);

  protected readonly entries:Signal<ReadonlyArray<TrashEntry>> = computed(():ReadonlyArray<TrashEntry> => {
    return this.documents().map((metadata:MetadataType):TrashEntry => {
      const trashPath:TrashPath = this.parseTrashPath(metadata.path);
      return {
        metadata,
        fileName: trashPath.fileName,
        deletedAt: trashPath.deletedAt,
      };
    });
  });

  constructor() {
    this.loadSettings();
    this.loadTrash();
  }

  protected recover(entry:TrashEntry):void {
    if ( this.processing() ) { return; }
    const data:TreeData = {
      title: 'Recover document',
      description: `Select the destination parent for ${ entry.fileName }.`,
      submitLabel: 'Recover',
      closeAriaLabel: 'Close recovery dialog',
    };
    this.dialog
      .open(TreeComponent, { width: '92vw', maxWidth: '860px', disableClose: true, data })
      .afterClosed()
      .subscribe((destination:string | null):void => {
        if ( ! destination ) { return; }
        this.recoverToDestination(entry.metadata.path, destination);
      });
  }

  protected confirmRemoval(entry:TrashEntry):void {
    if ( this.processing() ) { return; }
    const data:ConfirmData = {
      title: 'Permanently delete document',
      message: `Permanently delete "${ entry.fileName }"? This permanently removes "${ entry.fileName }", all nested documents, and attachments.`,
      confirmLabel: 'Delete permanently',
      cancelLabel: 'Cancel',
      confirmColor: 'warn',
    };
    this.dialog
      .open(ConfirmComponent, { width: '90vw', maxWidth: '520px', data })
      .afterClosed()
      .subscribe((confirmed:boolean | undefined):void => {
        if ( confirmed !== true ) { return; }
        this.remove(entry.metadata.path);
      });
  }

  private loadTrash():void {
    this.loading.set(true);
    this.trashService
      .retrieve()
      .pipe(finalize(():void => this.loading.set(false)))
      .subscribe({
        next: (documents:ReadonlyArray<MetadataType>):void => {
          this.documents.set(documents);
        },
        error: (error:HttpErrorResponse):void => {
          this.documents.set([]);
          this.alertService.error(error.message || 'Unable to load trash.');
        },
      });
  }

  private loadSettings():void {
    this.httpService.GET<SettingsType>('/settings').subscribe({
      next: (settings:SettingsType):void => {
        this.timezone.set(settings.timezone);
      },
      error: (error:HttpErrorResponse):void => {
        this.alertService.error(error.message || 'Unable to load settings for trash timestamps.');
      },
    });
  }

  private recoverToDestination(path:string, destination:string):void {
    this.processing.set(true);
    this.trashService
      .recover(path, destination)
      .pipe(finalize(():void => this.processing.set(false)))
      .subscribe({
        next: ():void => {
          this.alertService.success('Document recovered successfully.');
          this.loadTrash();
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(error.message || 'Unable to recover document.');
        },
      });
  }

  private remove(path:string):void {
    this.processing.set(true);
    this.trashService
      .remove(path)
      .pipe(finalize(():void => this.processing.set(false)))
      .subscribe({
        next: ():void => {
          this.alertService.success('Document permanently deleted.');
          this.loadTrash();
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(error.message || 'Unable to permanently delete document.');
        },
      });
  }

  private parseTrashPath(path:string):TrashPath {
    const entry:string = path.replace(/^\/+/, '');
    const match:RegExpMatchArray | null = entry.match(/^(\d+)_([^/]+)$/);
    if ( ! match ) {
      return { fileName: path, deletedAt: null };
    }
    const deletedAt:Date = new Date(Number(match[ 1 ]));
    return {
      fileName: match[ 2 ],
      deletedAt: Number.isNaN(deletedAt.getTime()) ? null : deletedAt,
    };
  }

}

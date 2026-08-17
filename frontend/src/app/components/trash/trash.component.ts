import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertService } from 'src/app/services/alert.service';
import { TrashService } from 'src/app/services/trash.service';
import { LocalizationService } from 'src/app/services/localization.service';
import { ConfirmComponent, ConfirmData } from 'src/app/components/confirm/confirm.component';
import { TreeComponent, TreeData } from 'src/app/components/tree/tree.component';
import { LocalizedPipe, TimeZonePipe } from 'src/app/app.pipes';
import { MetadataType } from 'src/app/types';

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
  imports: [ TimeZonePipe, MatButtonModule, MatIconModule, MatTooltipModule, LocalizedPipe ],
})
export class TrashComponent {

  private readonly alertService:AlertService = inject(AlertService);
  private readonly dialog:MatDialog = inject(MatDialog);
  private readonly trashService:TrashService = inject(TrashService);
  private readonly localizationService:LocalizationService = inject(LocalizationService);

  protected readonly loading:WritableSignal<boolean> = signal(true);
  protected readonly processing:WritableSignal<boolean> = signal(false);
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
    this.loadTrash();
  }

  protected recover(entry:TrashEntry):void {
    if ( this.processing() ) { return; }
    const data:TreeData = {
      title: this.localizationService.getText('trash.dialogs.recover-title'),
      description: this.localizationService.getText('trash.dialogs.recover-description', { document: entry.fileName }),
      submitLabel: this.localizationService.getText('common.actions.recover'),
      closeAriaLabel: this.localizationService.getText('trash.dialogs.recover-close-label'),
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
      title: this.localizationService.getText('trash.dialogs.delete-title'),
      message: this.localizationService.getText('trash.dialogs.delete-message', { document: entry.fileName }),
      confirmLabel: this.localizationService.getText('common.actions.delete-permanently'),
      cancelLabel: this.localizationService.getText('common.actions.cancel'),
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
          this.alertService.error(this.localizationService.getText('trash.messages.load-unavailable'));
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
          this.alertService.success(this.localizationService.getText('trash.messages.recover-success'));
          this.loadTrash();
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(this.localizationService.getText('trash.messages.recover-unavailable'));
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
          this.alertService.success(this.localizationService.getText('trash.messages.delete-success'));
          this.loadTrash();
        },
        error: (error:HttpErrorResponse):void => {
          this.alertService.error(this.localizationService.getText('trash.messages.delete-unavailable'));
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

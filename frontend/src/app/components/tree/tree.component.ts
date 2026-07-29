import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTreeModule } from '@angular/material/tree';
import { AlertService } from 'src/app/services/alert.service';
import { HttpService } from 'src/app/services/http.service';
import { MetadataType, TreeType } from 'src/app/types';

type TreeNode = {
  readonly path:string;
  readonly title:string;
  children:TreeNode[];
  loaded:boolean;
  loading:boolean;
  expandable:boolean;
  error:string | null;
};

export type TreeData = {
  readonly title:string;
  readonly description:string;
  readonly submitLabel:string;
  readonly closeAriaLabel:string;
  readonly sourcePath?:string;
};

@Component({
  standalone: true,
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss',
  imports: [ MatDialogModule, MatButtonModule, MatIconModule, MatTreeModule, MatProgressBarModule ],
})
export class TreeComponent {

  private readonly httpService:HttpService = inject(HttpService);
  private readonly alertService:AlertService = inject(AlertService);
  private readonly dialogRef:MatDialogRef<TreeComponent, string | null> = inject(MatDialogRef<TreeComponent, string | null>);

  protected readonly data:TreeData = inject<TreeData>(MAT_DIALOG_DATA);
  protected readonly dataSource:WritableSignal<TreeNode[]> = signal<TreeNode[]>([]);
  protected readonly childrenAccessor = (node:TreeNode):TreeNode[] => node.children;

  protected readonly selectedPath:WritableSignal<string | null> = signal<string | null>(null);
  protected readonly isInitializing:WritableSignal<boolean> = signal<boolean>(true);

  private readonly sourcePath:string | null = this.normalizePath(this.data.sourcePath ?? '');
  private readonly sourceParentPath:string = this.getParentPath(this.sourcePath ?? '/');
  private readonly rootNode:TreeNode = this.createNode('/', '/');

  constructor() {
    this.dataSource.set([ this.rootNode ]);
    void this.bootstrapTree();
  }

  protected readonly hasChild = (_:number, node:TreeNode):boolean => node.expandable;

  protected close():void {
    this.dialogRef.close(null);
  }

  protected selectNode(node:TreeNode):void {
    if ( ! this.isSelectable(node.path) ) { return; }
    this.selectedPath.set(node.path);
  }

  protected isSelected(node:TreeNode):boolean {
    return this.selectedPath() === node.path;
  }

  protected isSelectable(path:string):boolean {
    return ( ! this.isInvalidDestination(path) );
  }

  protected onNodeExpanded(node:TreeNode, expanded:boolean):void {
    if ( ! expanded || node.loaded || node.loading ) { return; }
    void this.loadChildren(node);
  }

  protected submitSelection():void {
    const destination:string | null = this.selectedPath();
    if ( ! destination || ! this.isSelectable(destination) ) { return; }
    this.dialogRef.close(destination);
  }

  private async bootstrapTree():Promise<void> {
    await this.loadChildren(this.rootNode);
    if ( this.sourcePath ) {
      await this.preselectSourceParent();
    } else {
      this.selectedPath.set('/');
    }
    this.isInitializing.set(false);
  }

  private async preselectSourceParent():Promise<void> {
    if ( this.sourceParentPath === '/' ) {
      this.selectedPath.set('/');
      return;
    }
    const parts:string[] = this.sourceParentPath.split('/').filter((part:string):boolean => part.length > 0);
    let currentNode:TreeNode = this.rootNode;
    for ( const part of parts ) {
      await this.loadChildren(currentNode);
      const nextPath:string = ( currentNode.path === '/' ? `/${ part }` : `${ currentNode.path }/${ part }` );
      const nextNode:TreeNode | undefined = currentNode.children.find((child:TreeNode):boolean => child.path === nextPath);
      if ( ! nextNode ) {
        this.selectedPath.set('/');
        return;
      }
      currentNode = nextNode;
    }
    this.selectedPath.set(currentNode.path);
  }

  private async loadChildren(node:TreeNode):Promise<void> {
    if ( node.loaded || node.loading ) { return; }
    node.loading = true;
    node.error = null;
    this.refreshTree();
    try {
      const tree:TreeType = await firstValueFrom(this.httpService.GET<TreeType>(`/tree?path=${ encodeURIComponent(node.path) }`));
      const children:TreeNode[] = tree.leaves.map((metadata:MetadataType):TreeNode => this.createNode(metadata.path, metadata.title));
      node.children = children;
      node.expandable = children.length > 0;
      node.loaded = true;
    } catch (error:unknown) {
      const httpError:HttpErrorResponse | null = ( error instanceof HttpErrorResponse ? error : null );
      node.error = httpError?.message || 'Unable to load children';
      this.alertService.error(node.error);
    } finally {
      node.loading = false;
      this.refreshTree();
    }
  }

  private createNode(path:string, title:string):TreeNode {
    const normalizedPath:string = ( this.normalizePath(path) ?? '/' );
    return {
      path: normalizedPath,
      title: title.trim().length > 0 ? title.trim() : this.getPathLabel(normalizedPath),
      children: [],
      loaded: false,
      loading: false,
      expandable: true,
      error: null,
    };
  }

  private getPathLabel(path:string):string {
    if ( path === '/' ) { return '/'; }
    const parts:string[] = path.split('/').filter((part:string):boolean => part.length > 0);
    return ( parts.at(-1) ?? path );
  }

  private isInvalidDestination(path:string):boolean {
    if ( ! this.sourcePath ) { return false; }
    const normalizedPath:string = this.normalizePath(path) ?? '/';
    if ( normalizedPath === this.sourcePath ) { return true; }
    return normalizedPath.startsWith(`${ this.sourcePath }/`);
  }

  private refreshTree():void {
    this.dataSource.set([ ...this.dataSource() ]);
  }

  private normalizePath(rawPath:string):string | null {
    const normalized:string = rawPath
      .trim()
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/');
    if ( ! normalized ) { return null; }
    const withLeadingSlash:string = ( normalized.startsWith('/') ? normalized : `/${ normalized }` );
    const withoutTrailingSlash:string = withLeadingSlash.replace(/\/+$/g, '');
    return ( withoutTrailingSlash || '/' );
  }

  private getParentPath(path:string):string {
    if ( ! path || path === '/' ) { return '/'; }
    const pathParts:string[] = path.split('/').filter((part:string):boolean => part.length > 0);
    if ( pathParts.length <= 1 ) { return '/'; }
    return `/${ pathParts.slice(0, -1).join('/') }`;
  }

}

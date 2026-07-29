import { basename, join } from 'node:path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {

  public static readonly CONTENT_FILE:string = 'content.md';
  public static readonly VERSIONS_DIRECTORY:string = '_versions';

  constructor(
    private readonly configService:ConfigService
  ) {}

  public getMode():'local' | 'private' | 'public' {
    return this.configService.getOrThrow<string>('MODE') as 'local' | 'private' | 'public';
  }

  public getSecret():string {
    return this.configService.getOrThrow<string>('SECRET');
  }

  public getDatasetsRoot():string {
    return this.configService.getOrThrow<string>('DATASETS');
  }

  public getSettingsPath():string {
    return join(this.getDatasetsRoot(), 'settings.json');
  }

  public getAccountsPath():string {
    return join(this.getDatasetsRoot(), 'accounts.json');
  }

  public getPinnedPath():string {
    return join(this.getDatasetsRoot(), 'pinned.json');
  }

  public getDocumentsRoot():string {
    return join(this.getDatasetsRoot(), 'documents');
  }

  public getTrashRoot():string {
    return join(this.getDatasetsRoot(), 'trash');
  }

  public getDocumentDirectoryPath(path:string, deleted:boolean = false):string {
    const root:string = ( deleted ? this.getTrashRoot() : this.getDocumentsRoot() );
    return join(root, path);
  }

  public getDocumentContentPath(path:string, deleted:boolean = false):string {
    return join(this.getDocumentDirectoryPath(path, deleted), EnvironmentService.CONTENT_FILE);
  }

  public sanitizeDocumentPath(path:string):string {
    const sanitized:string = path
      .trim()
      .toLowerCase()
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '')
      .replace(/\/+/g, '/')
      .replace(/^\/$/g, '')
      .replace(/[^a-z0-9_.-/]/g, '-')
      .replace(/-{2,}/g, '-');
    if ( sanitized.includes('..') ) {
      throw new BadRequestException(`Invalid path <${ path }>, '..' is not allowed`);
    }
    if ( sanitized.includes(EnvironmentService.VERSIONS_DIRECTORY) ) {
      throw new BadRequestException(`Invalid path <${ path }>, '${ EnvironmentService.VERSIONS_DIRECTORY }' is not allowed`);
    }
    return sanitized;
  }

  public sanitizeAttachmentFilename(file:string):string {
    return basename(this.sanitizeDocumentPath(file));
  }

}

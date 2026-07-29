import archiver = require('archiver');
import { constants, createReadStream, createWriteStream, Dirent, ReadStream, Stats } from 'node:fs';
import { access, cp, mkdir, mkdtemp, readdir, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as unzipper from 'unzipper';
import { ActionsContract } from '@shared/contracts';
import { DocumentService } from 'src/services/document.service';
import { EnvironmentService } from 'src/services/environment.service';
import { SnapshotDocumentSchema, SnapshotSchema } from 'src/schemas';

export type SyncStream = {
  stream:ReadStream;
  contentLength:number;
  cleanup:() => Promise<void>;
};

type SyncUpload = {
  buffer:Buffer;
};

type ImportedFile = {
  source:unzipper.File;
  relativePath:string;
};

type ImportedDocument = {
  path:string;
  files:ImportedFile[];
};

@Injectable()
export class SyncService {

  private readonly logger:Logger = new Logger('SyncService');

  private syncInProgress:boolean = false;

  constructor(
    private readonly environmentService:EnvironmentService,
    private readonly documentService:DocumentService
  ) {}

  private async retrieveSnapshotRecursively(directoryPath:string):Promise<SnapshotDocumentSchema[]> {
    const documents:SnapshotDocumentSchema[] = [];
    const childDirectories:Dirent[] = [];
    const entries:Dirent[] = await readdir(directoryPath, { withFileTypes: true });
    for ( const entry of entries ) {
      if ( entry.isSymbolicLink() ) { continue; }
      if ( entry.isDirectory() ) {
        if ( entry.name.toLowerCase() !== EnvironmentService.VERSIONS_DIRECTORY ) {
          childDirectories.push(entry);
        }
        continue;
      }
      if ( ! entry.isFile() || entry.name.toLowerCase() !== EnvironmentService.CONTENT_FILE ) { continue; }
      const contentPath:string = join(directoryPath, entry.name);
      const contentStats:Stats = await stat(contentPath);
      await access(contentPath, constants.R_OK);
      let latestModification:number = contentStats.mtimeMs;
      // Process attachments only for directories that contain a valid document.
      for ( const attachment of entries ) {
        if ( attachment.isSymbolicLink() || ! attachment.isFile() || attachment.name.toLowerCase() === EnvironmentService.CONTENT_FILE ) {
          continue;
        }
        const attachmentPath:string = join(directoryPath, attachment.name);
        const attachmentStats:Stats = await stat(attachmentPath);
        await access(attachmentPath, constants.R_OK);
        latestModification = Math.max(latestModification, attachmentStats.mtimeMs);
      }
      const documentPath:string = relative(this.environmentService.getDocumentsRoot(), directoryPath);
      const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(documentPath);
      documents.push({
        path: `/${ sanitizedPath }`,
        time: latestModification
      });
    }
    for ( const childDirectory of childDirectories ) {
      const childPath:string = join(directoryPath, childDirectory.name);
      documents.push(...await this.retrieveSnapshotRecursively(childPath));
    }
    return documents;
  }

  private normalizeActionPaths(paths:string[]):string[] {
    const normalizedPaths:string[] = [];
    const uniquePaths:Set<string> = new Set<string>();
    for ( const path of paths ) {
      const normalizedPath:string = this.environmentService.sanitizeDocumentPath(path);
      if ( ! uniquePaths.has(normalizedPath) ) {
        uniquePaths.add(normalizedPath);
        normalizedPaths.push(normalizedPath);
      }
    }
    return normalizedPaths;
  }

  private async appendDocumentFiles(archive:archiver.Archiver, documentPath:string):Promise<void> {
    const directoryPath:string = this.environmentService.getDocumentDirectoryPath(documentPath);
    const documentStats:Stats | null = await stat(directoryPath).catch(():null => null);
    if ( ! documentStats?.isDirectory() ) { throw new NotFoundException(`Document <${ documentPath }> not found`); }
    await access(directoryPath, constants.R_OK);
    const entries:Dirent[] = await readdir(directoryPath, { withFileTypes: true });
    const contentEntry:Dirent | undefined = entries.find((entry:Dirent):boolean => (
      entry.isFile() && entry.name.toLowerCase() === EnvironmentService.CONTENT_FILE
    ));
    if ( ! contentEntry ) { throw new NotFoundException(`Document <${ documentPath }> not found`); }
    const archiveRoot:string = documentPath.replace(/\\/g, '/');
    const contentPath:string = join(directoryPath, contentEntry.name);
    await access(contentPath, constants.R_OK);
    archive.file(contentPath, { name: `${ archiveRoot }/${ contentEntry.name }` });
    const versionsEntry:Dirent | undefined = entries.find((entry:Dirent):boolean => (
      entry.isDirectory() && entry.name.toLowerCase() === EnvironmentService.VERSIONS_DIRECTORY
    ));
    for ( const entry of entries ) {
      if ( entry.isSymbolicLink() || ! entry.isFile() || entry.name.toLowerCase() === EnvironmentService.CONTENT_FILE ) {
        continue;
      }
      const attachmentPath:string = join(directoryPath, entry.name);
      await access(attachmentPath, constants.R_OK);
      archive.file(attachmentPath, { name: `${ archiveRoot }/${ entry.name }` });
    }
    if ( versionsEntry ) {
      const versionsPath:string = join(directoryPath, versionsEntry.name);
      const versionEntries:Dirent[] = await readdir(versionsPath, { withFileTypes: true });
      for ( const entry of versionEntries ) {
        if ( entry.isSymbolicLink() || ! entry.isFile() ) { continue; }
        const versionFilePath:string = join(versionsPath, entry.name);
        await access(versionFilePath, constants.R_OK);
        archive.file(versionFilePath, { name: `${ archiveRoot }/${ versionsEntry.name }/${ entry.name }` });
      }
    }
  }

  private async createArchive(documentPaths:string[]):Promise<SyncStream> {
    const temporaryDirectory:string = await mkdtemp(join(tmpdir(), 'wikidocs-sync-'));
    const archivePath:string = join(temporaryDirectory, 'sync.zip');
    let output:ReturnType<typeof createWriteStream> | undefined;
    try {
      output = createWriteStream(archivePath);
      const archive:archiver.Archiver = new archiver.ZipArchive({ zlib: { level: 9 } });
      let archiveError:Error | undefined;
      const outputCompletion:Promise<void> = new Promise<void>((resolve, reject):void => {
        output?.once('finish', resolve);
        output?.once('error', reject);
      });
      archive.on('warning', (error:Error):void => { archiveError ??= error; });
      archive.on('error', (error:Error):void => { archiveError ??= error; });
      archive.pipe(output);
      for ( const documentPath of documentPaths ) {
        await this.appendDocumentFiles(archive, documentPath);
      }
      await archive.finalize();
      await outputCompletion;
      if ( archiveError ) { throw archiveError; }
      const archiveStats:Stats = await stat(archivePath);
      const stream:ReadStream = createReadStream(archivePath);
      let cleaned:boolean = false;
      const cleanup = async ():Promise<void> => {
        if ( cleaned ) { return; }
        cleaned = true;
        await rm(temporaryDirectory, { recursive: true, force: true });
      };
      return {
        stream,
        contentLength: archiveStats.size,
        cleanup
      };
    } catch ( error ) {
      output?.destroy();
      await rm(temporaryDirectory, { recursive: true, force: true });
      throw error;
    }
  }

  private normalizeArchivePath(path:string):string[] {
    const normalizedPath:string = path.replace(/\\/g, '/');
    if ( normalizedPath.includes('\0') || normalizedPath.includes('//') ) {
      throw new BadRequestException(`Invalid archive entry <${ path }>`);
    }
    const segments:string[] = normalizedPath.replace(/^\/+|\/+$/g, '').split('/');
    if ( ! segments.length || segments.some((segment:string):boolean => ! segment) ) {
      throw new BadRequestException(`Invalid archive entry <${ path }>`);
    }
    return segments;
  }

  private sanitizeArchiveDocumentPath(segments:string[], originalPath:string):string {
    const documentPath:string = segments.join('/');
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(documentPath);
    if ( sanitizedPath !== documentPath ) {
      throw new BadRequestException(`Invalid archive document path <${ originalPath }>`);
    }
    return sanitizedPath;
  }

  private validateArchiveFileName(fileName:string, originalPath:string):void {
    if ( fileName === EnvironmentService.CONTENT_FILE ) { return; }
    const sanitizedFileName:string = this.environmentService.sanitizeAttachmentFilename(fileName);
    if ( sanitizedFileName !== fileName || fileName === EnvironmentService.VERSIONS_DIRECTORY ) {
      throw new BadRequestException(`Invalid archive file <${ originalPath }>`);
    }
  }

  private validateArchiveDirectory(segments:string[], originalPath:string):void {
    if ( segments.at(-1) === EnvironmentService.CONTENT_FILE ) {
      throw new BadRequestException(`Invalid archive directory <${ originalPath }>`);
    }
    const documentSegments:string[] = (
      segments.at(-1) === EnvironmentService.VERSIONS_DIRECTORY ? segments.slice(0, -1) : segments
    );
    if ( segments.slice(0, -1).includes(EnvironmentService.VERSIONS_DIRECTORY) ) {
      throw new BadRequestException(`Invalid archive directory <${ originalPath }>`);
    }
    this.sanitizeArchiveDocumentPath(documentSegments, originalPath);
  }

  private isSymbolicLink(file:unzipper.File):boolean {
    const fileType:number = ( file.externalFileAttributes >>> 16 ) & 0o170000;
    return fileType === 0o120000;
  }

  private validateArchiveFiles(files:unzipper.File[]):ImportedDocument[] {
    const archiveFiles:ImportedFile[] = [];
    const documentPaths:Set<string> = new Set<string>();
    const uniqueFilePaths:Set<string> = new Set<string>();
    for ( const file of files ) {
      const segments:string[] = this.normalizeArchivePath(file.path);
      if ( this.isSymbolicLink(file) ) {
        throw new BadRequestException(`Symbolic links are not allowed in sync archives`);
      }
      if ( file.type === 'Directory' ) {
        this.validateArchiveDirectory(segments, file.path);
        continue;
      }
      if ( file.type !== 'File' ) {
        throw new BadRequestException(`Invalid archive entry <${ file.path }>`);
      }
      const normalizedPath:string = segments.join('/');
      if ( uniqueFilePaths.has(normalizedPath) ) {
        throw new BadRequestException(`Duplicate archive entry <${ file.path }>`);
      }
      uniqueFilePaths.add(normalizedPath);
      if ( segments.at(-1) === EnvironmentService.CONTENT_FILE ) {
        documentPaths.add(this.sanitizeArchiveDocumentPath(segments.slice(0, -1), file.path));
      }
      archiveFiles.push({ source: file, relativePath: normalizedPath });
    }
    const documents:Map<string, ImportedDocument> = new Map<string, ImportedDocument>();
    for ( const documentPath of documentPaths ) {
      documents.set(documentPath, { path: documentPath, files: [] });
    }
    for ( const archiveFile of archiveFiles ) {
      const segments:string[] = archiveFile.relativePath.split('/');
      const documentPath:string | undefined = [ ...documentPaths ]
        .sort((first:string, second:string):number => second.length - first.length)
        .find((candidate:string):boolean => {
          const candidateSegments:string[] = ( candidate ? candidate.split('/') : [] );
          return candidateSegments.every((segment:string, index:number):boolean => segments[ index ] === segment);
        });
      if ( documentPath === undefined ) {
        throw new BadRequestException(`Archive entry <${ archiveFile.relativePath }> has no document`);
      }
      const documentSegments:string[] = ( documentPath ? documentPath.split('/') : [] );
      const remainingSegments:string[] = segments.slice(documentSegments.length);
      if (
        ( remainingSegments.length === 1 && remainingSegments[ 0 ] === EnvironmentService.CONTENT_FILE ) ||
        ( remainingSegments.length === 1 && remainingSegments[ 0 ] !== EnvironmentService.CONTENT_FILE ) ||
        ( remainingSegments.length === 2 && remainingSegments[ 0 ] === EnvironmentService.VERSIONS_DIRECTORY )
      ) {
        this.validateArchiveFileName(remainingSegments.at(-1) ?? '', archiveFile.relativePath);
        documents.get(documentPath)?.files.push({
          source: archiveFile.source,
          relativePath: remainingSegments.join('/')
        });
        continue;
      }
      throw new BadRequestException(`Invalid archive entry <${ archiveFile.relativePath }>`);
    }
    for ( const document of documents.values() ) {
      if ( ! document.files.some((file:ImportedFile):boolean => file.relativePath === EnvironmentService.CONTENT_FILE) ) {
        throw new BadRequestException(`Archive document <${ document.path || '/' }> has no content file`);
      }
    }
    return [ ...documents.values() ];
  }

  private async stageArchiveDocuments(documents:ImportedDocument[], temporaryDirectory:string):Promise<string[]> {
    const stagingDirectories:string[] = [];
    for ( const [ index, document ] of documents.entries() ) {
      const stagingDirectory:string = join(temporaryDirectory, index.toString());
      for ( const file of document.files ) {
        const destinationPath:string = join(stagingDirectory, file.relativePath);
        await mkdir(dirname(destinationPath), { recursive: true });
        const content:Buffer = await file.source.buffer()
          .catch(():never => { throw new BadRequestException('Invalid sync archive'); });
        await writeFile(destinationPath, content);
        await utimes(destinationPath, file.source.lastModifiedDateTime, file.source.lastModifiedDateTime);
      }
      stagingDirectories.push(stagingDirectory);
    }
    return stagingDirectories;
  }

  public async sync_snapshot():Promise<SnapshotSchema> {
    const documentsRoot:string = this.environmentService.getDocumentsRoot();
    const documents:SnapshotDocumentSchema[] = await this.retrieveSnapshotRecursively(documentsRoot);
    documents.sort((first:SnapshotDocumentSchema, second:SnapshotDocumentSchema):number => (
      first.path.localeCompare(second.path)
    ));
    return {
      timestamp: new Date().toISOString(),
      documents
    };
  }

  public async sync_actions(actions:ActionsContract):Promise<SyncStream> {
    if ( this.syncInProgress ) { throw new ConflictException('A sync operation is already in progress'); }
    this.syncInProgress = true;
    try {
      const retrieve:string[] = this.normalizeActionPaths(actions.retrieve);
      const deletePaths:string[] = this.normalizeActionPaths(actions.delete);
      const retrieveSet:Set<string> = new Set<string>(retrieve);
      if ( deletePaths.some((path:string):boolean => retrieveSet.has(path)) ) {
        throw new BadRequestException('A document cannot be retrieved and deleted in the same sync');
      }
      const archive:SyncStream = await this.createArchive(retrieve);
      try {
        for ( const path of deletePaths ) {
          try {
            await this.documentService.document_remove(path);
          } catch ( error ) {
            if ( ! ( error instanceof NotFoundException ) ) { throw error; }
            this.logger.warn(`Document <${ path }> was already removed during sync`);
          }
        }
        return archive;
      } catch ( error ) {
        await archive.cleanup();
        throw error;
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  public async sync_import(uploaded:SyncUpload):Promise<void> {
    if ( ! uploaded || ! Buffer.isBuffer(uploaded.buffer) ) {
      throw new BadRequestException('Missing uploaded file');
    }
    if ( this.syncInProgress ) { throw new ConflictException('A sync operation is already in progress'); }
    this.syncInProgress = true;
    let temporaryDirectory:string | undefined;
    try {
      const archive:unzipper.CentralDirectory = await unzipper.Open.buffer(uploaded.buffer)
        .catch(():never => { throw new BadRequestException('Invalid sync archive'); });
      const documents:ImportedDocument[] = this.validateArchiveFiles(archive.files);
      temporaryDirectory = await mkdtemp(join(tmpdir(), 'wikidocs-sync-import-'));
      const stagingDirectories:string[] = await this.stageArchiveDocuments(documents, temporaryDirectory);
      for ( const [ index, document ] of documents.entries() ) {
        const destinationPath:string = this.environmentService.getDocumentDirectoryPath(document.path);
        if ( await stat(destinationPath).then(():boolean => true).catch(():boolean => false) ) {
          await this.documentService.document_remove(document.path, true, false);
        }
        for ( const file of document.files ) {
          const sourcePath:string = join(stagingDirectories[ index ], file.relativePath);
          const targetPath:string = join(destinationPath, file.relativePath);
          await mkdir(dirname(targetPath), { recursive: true });
          await cp(sourcePath, targetPath, { force: true, preserveTimestamps: true });
          this.logger.debug(`Sync file <${ targetPath }> updated`);
        }
        this.logger.debug(`Document <${ destinationPath }> updated from sync archive`);
      }
    } finally {
      this.syncInProgress = false;
      if ( temporaryDirectory ) {
        await rm(temporaryDirectory, { force: true, recursive: true });
      }
    }
  }

}

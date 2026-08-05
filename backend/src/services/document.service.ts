import matter from 'gray-matter';
import { basename, join } from "node:path";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createInterface, Interface } from "node:readline";
import { constants, createReadStream, Dirent, ReadStream, Stats } from "node:fs";
import { access, copyFile, mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { PinnedService } from "src/services/pinned.service";
import { EnvironmentService } from "src/services/environment.service";
import { SettingsService } from 'src/services/settings.service';
import { AttachmentSchema, ContentSchema, DocumentSchema, MetadataSchema, SettingsSchema, TokenSchema, TrashSchema, TreeSchema } from 'src/schemas';

interface FrontMatterInterface {
  title: string;
  timestamp: string;
  author: string;
  tags: string[];
}

export type AttachmentStream = {
  stream:ReadStream;
  fileType:string;
  fileName:string;
  contentLength:number;
};

@Injectable()
export class DocumentService {

  private readonly logger:Logger = new Logger('DocumentService');

  constructor(
    private readonly environmentService:EnvironmentService,
    private readonly settingsService:SettingsService,
    @Inject(forwardRef(() => PinnedService))
    private readonly pinnedService:PinnedService
  ) {}

  private handleFsError(error:unknown):never {
    const fsError:NodeJS.ErrnoException & { dest?:string } = ( error as NodeJS.ErrnoException & { dest?:string } );
    const message:string = ( error instanceof Error ? error.message : String(error) );
    const code:string | undefined = ( error as NodeJS.ErrnoException )?.code;
    const target:string = fsError.path ?? fsError.dest ?? 'unknown';
    if ( code === 'EACCES' || code === 'EPERM' ) {
      this.logger.fatal(`Permission denied for <${ target }>`);
    } else {
      this.logger.fatal(`Unhandled error for <${ target }>: ${ code ?? '00' } ${ message }`);
    }
    throw new InternalServerErrorException(`Check logs for more information`);
  }

  private signAttachmentTokenPayload(payload:string):string {
    const secret:string = this.environmentService.getSecret();
    return createHmac('sha256', secret)
      .update(payload)
      .digest()
      .subarray(0, 16)
      .toString('base64url');
  }

  private generateAttachmentToken(path:string, file:string):string {
    const expiration:number = Math.floor(Date.now() / 1000) + ( 60 * 60 * 24 );
    const payload:string = `${ path }|${ file }|${ expiration.toString(36) }`;
    const encodedPayload:string = Buffer.from(payload, 'utf-8').toString('base64url');
    const signature:string = this.signAttachmentTokenPayload(payload);
    return `${ encodedPayload }.${ signature }`;
  }

  private validateAttachmentToken(path:string, file:string, token:string):void {
    if ( ! token ) { throw new UnauthorizedException('Missing attachment token'); }
    const normalizedToken:string = token.trim();
    const tokenParts:string[] = normalizedToken.split('.');
    if ( tokenParts.length !== 2 ) {
      throw new UnauthorizedException('Invalid attachment token');
    }
    const [ encodedPayload, providedSignature ] = tokenParts;
    if ( ! /^[A-Za-z0-9_-]+$/.test(encodedPayload) || ! /^[A-Za-z0-9_-]+$/.test(providedSignature) ) {
      throw new UnauthorizedException('Invalid attachment token');
    }
    const payload:string = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payloadParts:string[] = payload.split('|');
    if ( payloadParts.length !== 3 ) {
      throw new UnauthorizedException('Invalid attachment token');
    }
    const [ payloadPath, payloadFile, payloadExpiration ] = payloadParts;
    const expiration:number = Number.parseInt(payloadExpiration, 36);
    if ( ! Number.isFinite(expiration) || expiration <= 0 ) {
      throw new UnauthorizedException('Invalid attachment token');
    }
    if ( payloadPath !== path || payloadFile !== file ) {
      throw new UnauthorizedException('Invalid attachment token');
    }
    if ( Math.floor(Date.now() / 1000) > expiration ) {
      throw new UnauthorizedException('Expired attachment token');
    }
    const expectedSignature:string = this.signAttachmentTokenPayload(payload);
    const expectedBuffer:Buffer = Buffer.from(expectedSignature);
    const providedBuffer:Buffer = Buffer.from(providedSignature);
    if ( expectedBuffer.length !== providedBuffer.length || ! timingSafeEqual(expectedBuffer, providedBuffer) ) {
      throw new UnauthorizedException('Invalid attachment token');
    }
  }

  public async checkIfDirectoryExists(path:string):Promise<boolean> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const directoryPath:string = this.environmentService.getDocumentDirectoryPath(sanitizedPath);
    const directoryStats:Stats | null = await stat(directoryPath).catch(():null => null);
    return ( !! directoryStats?.isDirectory() );
  }

  public async checkIfDocumentExists(path:string, deleted:boolean = false):Promise<boolean> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const directoryPath:string = this.environmentService.getDocumentDirectoryPath(sanitizedPath, deleted);
    const directoryStats:Stats | null = await stat(directoryPath).catch(():null => null);
    this.logger.debug(`Retrieve document <${ sanitizedPath }>`);
    if ( ! directoryStats?.isDirectory() ) {
      this.logger.error(`Document <${ directoryPath }> not found`);
      return false;
    }
    const documentPath:string = this.environmentService.getDocumentContentPath(sanitizedPath, deleted);
    const documentStats:Stats | null = await stat(documentPath).catch(():null => null);
    if ( ! documentStats?.isFile() ) {
      this.logger.warn(`Document <${ sanitizedPath }> not exists`);
      //throw new NotFoundException(`Document <${ path }> not exists`);
      return false;
    } else {
      try {
        await access(documentPath, constants.R_OK);
        return true;
      } catch ( error ) {
        this.handleFsError(error);
      }
    }
  }

  public async buildDocumentMetadata(path:string, deleted:boolean = false):Promise<MetadataSchema> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const document:MetadataSchema = { path: '/' + sanitizedPath, title: '', author: '', timestamp: '', tags: [] }
    if ( await this.checkIfDocumentExists(path, deleted) ) {
      const parsedFrontMatter:FrontMatterInterface | null = await this.loadDocumentFrontMatter(path, deleted);
      if ( parsedFrontMatter ) {
        document.title = parsedFrontMatter.title;
        document.author = parsedFrontMatter.author;
        document.timestamp = parsedFrontMatter.timestamp;
        document.tags = parsedFrontMatter.tags;
      }
    }
    document.title = await this.resolveMetadataTitle(sanitizedPath, document.title);
    return document;
  }

  private async resolveMetadataTitle(sanitizedPath:string, title:string):Promise<string> {
    const normalizedTitle:string = title.trim();
    if ( normalizedTitle.length > 0 ) { return normalizedTitle; }
    if ( sanitizedPath ) { return ( sanitizedPath.split('/').at(-1) ?? sanitizedPath ); }
    const settings:SettingsSchema = await this.settingsService.retrieve();
    return settings.title.trim();
  }

  private async loadDocumentFrontMatter(path:string, deleted:boolean = false):Promise<FrontMatterInterface | null> {
    const documentPath:string = this.environmentService.getDocumentContentPath(this.environmentService.sanitizeDocumentPath(path), deleted);
    const stream:ReadStream = createReadStream(documentPath, { encoding: 'utf-8' });
    const splitLinesByNRl:Interface = createInterface({ input: stream, crlfDelay: Infinity });
    const frontMatterLines:string[] = [];
    try {
      for await ( const line of splitLinesByNRl ) {
        if ( frontMatterLines.length === 0 && line.trim() !== '---' ) { return null; }
        frontMatterLines.push(line);
        if ( frontMatterLines.length > 1 && line.trim() === '---' ) {
          const plain:string = frontMatterLines.join('\n');
          const { data } = matter(plain);
          return data as FrontMatterInterface;
        }
      }
    } finally {
      stream.destroy();
    }
    if ( frontMatterLines.length > 0 ) {
      this.logger.debug(`Front matter opened but never closed in <${ documentPath }>`);
    }
    return null;
  }

  private async retriveChildren(path:string):Promise<MetadataSchema[]> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const directoryPath:string = this.environmentService.getDocumentDirectoryPath(sanitizedPath);
    try {
      const entries:Dirent[] = await readdir(directoryPath, { withFileTypes: true });
      const subDirectories:Dirent[] = entries
        .filter((entry:Dirent):boolean => entry.isDirectory())
        .filter((entry:Dirent):boolean => entry.name.toLowerCase() !== EnvironmentService.VERSIONS_DIRECTORY);
      return await Promise.all(
        subDirectories.map(async (entry):Promise<MetadataSchema> => {
          const subPath:string = [ sanitizedPath, entry.name ].filter(Boolean).join('/');
          return this.buildDocumentMetadata(subPath);
        })
      );
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

  private async retrieveAttachments(path:string):Promise<AttachmentSchema[]> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const directoryPath:string = this.environmentService.getDocumentDirectoryPath(sanitizedPath);
    try {
      const entries:Dirent[] = await readdir(directoryPath, { withFileTypes: true });
      return entries
        .filter((entry:Dirent):boolean => ( entry.isFile() ))
        .filter((entry:Dirent):boolean => ( entry.name.toLowerCase() !== EnvironmentService.CONTENT_FILE ))
        .map((entry):AttachmentSchema => ( {
          path: '/' + sanitizedPath,
          file: entry.name,
          token: this.generateAttachmentToken(sanitizedPath, entry.name)
        } ));
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

  private async loadDocumentFullContent(path:string):Promise<ContentSchema> {
    const documentPath:string = this.environmentService.getDocumentContentPath(this.environmentService.sanitizeDocumentPath(path));
    try {
      const content:string = await readFile(documentPath, 'utf-8');
      return { raw: content.replace(/\r\n?/g, '\n') };
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

  private getVersionPath(path:string, timestamp:string):string {
    if ( ! /^(?:0|[1-9]\d*)$/.test(timestamp) ) {
      throw new NotFoundException(`Version <${ timestamp }> not found`);
    }
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    return join(
      this.environmentService.getDocumentDirectoryPath(sanitizedPath),
      EnvironmentService.VERSIONS_DIRECTORY,
      `${ timestamp }.md`
    );
  }

  private async retrieveVersions(path:string):Promise<string[]> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const versionsDirectoryPath:string = join(
      this.environmentService.getDocumentDirectoryPath(sanitizedPath),
      EnvironmentService.VERSIONS_DIRECTORY
    );
    let entries:Dirent[];
    try {
      entries = await readdir(versionsDirectoryPath, { withFileTypes: true });
    } catch ( error ) {
      const code:string | undefined = ( error as NodeJS.ErrnoException )?.code;
      if ( code === 'ENOENT' ) { return []; }
      this.handleFsError(error);
    }
    const timestamps:string[] = [];
    for ( const entry of entries ) {
      const match:RegExpMatchArray | null = ( entry.isFile() ? entry.name.match(/^(0|[1-9]\d*)\.md$/) : null );
      if ( ! match ) {
        this.logger.warn(`Ignoring invalid document version entry <${ entry.name }> for <${ sanitizedPath }>`);
        continue;
      }
      timestamps.push(match[ 1 ]);
    }
    return timestamps.sort((first:string, second:string):number => (
      second.length - first.length || second.localeCompare(first)
    ));
  }

  public async tree(path:string):Promise<TreeSchema> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    if ( ! await this.checkIfDirectoryExists(path) ) {
      const pathLabel:string = ( sanitizedPath ? `/${ sanitizedPath }` : '/' );
      this.logger.warn(`Tree path <${ pathLabel }> not found`);
      throw new NotFoundException(`Path <${ pathLabel }> not found`);
    }
    const leaves:MetadataSchema[] = await this.retriveChildren(path);
    return { leaves };
  }

  public async document_retrive(path:string):Promise<DocumentSchema> {
    const documentExists:boolean = await this.checkIfDocumentExists(path);
    const directoryExists:boolean = await this.checkIfDirectoryExists(path);
    const pinned:boolean = await this.pinnedService.isPinned(path);
    const metadata: MetadataSchema = await this.buildDocumentMetadata(path);
    const children: MetadataSchema[] = directoryExists ? await this.retriveChildren(path) : [];
    const attachments:AttachmentSchema[] = ( documentExists ? await this.retrieveAttachments(path) : [] );
    const versions: string[] = documentExists ? await this.retrieveVersions(path) : [];
    const content:ContentSchema = ( documentExists ? await this.loadDocumentFullContent(path) : { raw: '' } );
    this.logger.debug(`Document <${ path }> ${ ( documentExists ? 'retrieved' : ( directoryExists ? 'traversed' : 'not exists' ) ) }`);
    return { exists: documentExists, pinned, metadata, children, attachments, versions, content };
  }

  public async document_store(path:string, token:TokenSchema, content:ContentSchema):Promise<void> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const directoryPath:string = this.environmentService.getDocumentDirectoryPath(sanitizedPath);
    const documentPath:string = this.environmentService.getDocumentContentPath(sanitizedPath);
    try {
      await mkdir(directoryPath, { recursive: true });
      await access(directoryPath, constants.W_OK);
      const documentStats:Stats | null = await stat(documentPath).catch(():null => null);
      if ( documentStats?.isFile() ) { await access(documentPath, constants.W_OK); }
      if ( content.versioning === true && documentStats?.isFile() ) {
        const versionsDirectoryPath:string = join(directoryPath, EnvironmentService.VERSIONS_DIRECTORY);
        const versionPath:string = join(versionsDirectoryPath, `${ Date.now() }.md`);
        await mkdir(versionsDirectoryPath, { recursive: true });
        await access(versionsDirectoryPath, constants.W_OK);
        await access(documentPath, constants.R_OK);
        await copyFile(documentPath, versionPath);
        this.logger.debug(`Document <${ documentPath }> versioned to <${ versionPath }>`);
      }
      const { data, content: body } = matter(content.raw.replace(/\r\n?/g, '\n'));
      if ( ! data.title || typeof data.title !== 'string' || ! data.title.trim() ) {
        const heading:RegExpMatchArray | null = body.match(/^#\s+(.+)$/m);
        if ( heading?.[ 1 ] ) {
          data.title = heading[ 1 ].trim();
        } else {
          const segments:string[] = path.split('/').filter((segment:string):boolean => ( !! segment ));
          data.title = segments.at(-1) ?? '';
        }
      }
      if ( ! data.author ) { data.author = `${ token.firstname } ${ token.lastname } <${ token.account }>`; }
      if ( ! data.tags ) { data.tags = []; }
      data.timestamp = new Date().toISOString();
      await writeFile(documentPath, matter.stringify(body, data), 'utf-8');
      this.logger.debug(`Document <${ documentPath }> stored`);
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

  public async document_move(path:string, destination:string):Promise<void> {
    const sourceSanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const destinationSanitizedPath:string = this.environmentService.sanitizeDocumentPath(destination);
    if ( ! sourceSanitizedPath ) { throw new BadRequestException(`Root document cannot be moved`); }
    if ( sourceSanitizedPath === destinationSanitizedPath ) { throw new BadRequestException(`Destination equal to source`); }
    if ( destinationSanitizedPath.startsWith(sourceSanitizedPath) ) { throw new BadRequestException(`Destination inside the source`); }
    const sourceDirectoryName:string = basename(sourceSanitizedPath);
    const sourceDirectoryPath:string = this.environmentService.getDocumentDirectoryPath(sourceSanitizedPath);
    const destinationRootPath:string = this.environmentService.getDocumentDirectoryPath(destinationSanitizedPath);
    const destinationDocumentPath:string = join(destinationRootPath, sourceDirectoryName);
    const sourceStats:Stats | null = await stat(sourceDirectoryPath).catch(():null => null);
    if ( ! sourceStats?.isDirectory() ) {
      this.logger.warn(`Document directory <${ sourceDirectoryPath }> does not exist`);
      throw new NotFoundException(`Document <${ sourceSanitizedPath }> not found`);
    }
    try {
      await mkdir(destinationRootPath, { recursive: true });
      await access(destinationRootPath, constants.W_OK);
      await access(sourceDirectoryPath, constants.W_OK);
      await rename(sourceDirectoryPath, destinationDocumentPath);
      this.logger.debug(`Document <${ sourceDirectoryPath }> moved to <${ destinationDocumentPath }>`);
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

  private async moveDocumentToTrash(sanitizedPath:string, recursive:boolean):Promise<void> {
    const trashRoot:string = this.environmentService.getTrashRoot();
    const sourceDirectoryName:string = ( sanitizedPath ? basename(sanitizedPath) : 'index' );
    const sourceDirectoryPath:string = this.environmentService.getDocumentDirectoryPath(sanitizedPath);
    const destinationDirectoryName:string = `${ Date.now() }_${ sourceDirectoryName }`;
    const destinationDirectoryPath:string = join(trashRoot, destinationDirectoryName);
    const sourceStats:Stats | null = await stat(sourceDirectoryPath).catch(():null => null);
    if ( ! sourceStats?.isDirectory() ) {
      this.logger.warn(`Document directory <${ sourceDirectoryPath }> does not exist`);
      throw new NotFoundException(`Document <${ sanitizedPath }> not found`);
    }
    try {
      await mkdir(trashRoot, { recursive: true });
      await access(trashRoot, constants.W_OK);
      await access(sourceDirectoryPath, constants.W_OK);
      if ( recursive ) {
        await rename(sourceDirectoryPath, destinationDirectoryPath);
      } else {
        await mkdir(destinationDirectoryPath);
        const entries:Dirent[] = await readdir(sourceDirectoryPath, { withFileTypes: true });
        for ( const entry of entries ) {
          if ( entry.isDirectory() && entry.name !== EnvironmentService.VERSIONS_DIRECTORY ) { continue; }
          const sourceEntryPath:string = join(sourceDirectoryPath, entry.name);
          const destinationEntryPath:string = join(destinationDirectoryPath, entry.name);
          await rename(sourceEntryPath, destinationEntryPath);
        }
      }
      this.logger.debug(`Document <${ sourceDirectoryPath }> removed to <${ destinationDirectoryPath }>`);
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

  public async document_remove(path:string, allowRoot:boolean = false, recursive:boolean = true):Promise<void> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    if ( ! sanitizedPath && ! allowRoot ) { throw new BadRequestException(`Root document cannot be deleted`); }
    await this.moveDocumentToTrash(sanitizedPath, recursive);
  }

  public async version_retrieve(path:string, timestamp:string):Promise<ContentSchema> {
    const versionPath:string = this.getVersionPath(path, timestamp);
    try {
      const raw:string = await readFile(versionPath, 'utf-8');
      return { raw: raw.replace(/\r\n?/g, '\n') };
    } catch ( error ) {
      const code:string | undefined = ( error as NodeJS.ErrnoException )?.code;
      if ( code === 'ENOENT' ) { throw new NotFoundException(`Version <${ timestamp }> not found`); }
      this.handleFsError(error);
    }
  }

  public async version_remove(path:string, timestamp:string):Promise<void> {
    const versionPath:string = this.getVersionPath(path, timestamp);
    try {
      await unlink(versionPath);
      this.logger.debug(`Document version <${ versionPath }> removed`);
    } catch ( error ) {
      const code:string | undefined = ( error as NodeJS.ErrnoException )?.code;
      if ( code === 'ENOENT' ) { throw new NotFoundException(`Version <${ timestamp }> not found`); }
      this.handleFsError(error);
    }
  }

  private async detectAttachmentMimeType(attachmentPath:string):Promise<string> {
    const { fileTypeFromFile } = await import('file-type');
    const detectedFileType = await fileTypeFromFile(attachmentPath);
    return detectedFileType?.mime ?? 'application/octet-stream';
  }

  public async attachment_retrive(path:string, file:string, token:string):Promise<AttachmentStream> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const sanitizedFile:string = this.environmentService.sanitizeAttachmentFilename(file);
    this.validateAttachmentToken(sanitizedPath, sanitizedFile, token);
    const attachmentPath:string = join(this.environmentService.getDocumentDirectoryPath(sanitizedPath), sanitizedFile);
    const attachmentStats:Stats | null = await stat(attachmentPath).catch(():null => null);
    if ( ! attachmentStats?.isFile() ) {
      this.logger.warn(`Attachment <${ attachmentPath }> not found`);
      throw new NotFoundException(`Attachment <${ sanitizedFile }> not found`);
    }
    try {
      await access(attachmentPath, constants.R_OK);
      const fileType:string = await this.detectAttachmentMimeType(attachmentPath);
      const stream:ReadStream = createReadStream(attachmentPath);
      this.logger.debug(`Attachment <${ attachmentPath }> retrieved`);
      return {
        stream,
        fileType,
        fileName: sanitizedFile,
        contentLength: attachmentStats.size
      };
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

  public async attachment_store(path:string, file:string, uploaded:{ buffer:Buffer }):Promise<void> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const directoryPath:string = this.environmentService.getDocumentDirectoryPath(sanitizedPath);
    const sanitizedFile:string = this.environmentService.sanitizeAttachmentFilename(file);
    const attachmentPath:string = join(directoryPath, sanitizedFile);
    if ( ! uploaded || ! Buffer.isBuffer(uploaded.buffer) ) {
      throw new BadRequestException(`Missing uploaded file`);
    }
    if ( ! await this.checkIfDocumentExists(path) ) {
      throw new NotFoundException(`Document <${ sanitizedPath }> not found`);
    }
    try {
      await access(directoryPath, constants.W_OK);
      const attachmentStats:Stats | null = await stat(attachmentPath).catch(():null => null);
      if ( attachmentStats?.isFile() ) { await access(attachmentPath, constants.W_OK); }
      await writeFile(attachmentPath, uploaded.buffer);
      this.logger.debug(`Attachment <${ attachmentPath }> uploaded`);
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

  public async attachment_remove(path:string, file:string):Promise<void> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const sanitizedFile:string = this.environmentService.sanitizeAttachmentFilename(file);
    const attachmentPath:string = join(this.environmentService.getDocumentDirectoryPath(sanitizedPath), sanitizedFile);
    if ( ! await this.checkIfDocumentExists(path) ) {
      throw new NotFoundException(`Document <${ sanitizedPath }> not found`);
    }
    const attachmentStats:Stats | null = await stat(attachmentPath).catch(():null => null);
    if ( ! attachmentStats?.isFile() ) {
      this.logger.warn(`Attachment <${ attachmentPath }> not found`);
      throw new NotFoundException(`Attachment <${ sanitizedFile }> not found`);
    }
    try {
      await access(attachmentPath, constants.W_OK);
      await unlink(attachmentPath);
      this.logger.debug(`Attachment <${ attachmentPath }> removed`);
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

  public async trash_retrieve():Promise<TrashSchema> {
    const trashRoot:string = this.environmentService.getTrashRoot();
    try {
      const entries:Dirent[] = await readdir(trashRoot, { withFileTypes: true });
      const trashEntries:Dirent[] = entries
        .filter((entry:Dirent):boolean => entry.isDirectory())
        .sort((first:Dirent, second:Dirent):number => (
          second.name.localeCompare(first.name, undefined, { numeric: true })
        ));
      const documents:MetadataSchema[] = await Promise.all(
        trashEntries.map((entry:Dirent):Promise<MetadataSchema> => (
          this.buildDocumentMetadata(entry.name, true)
        ))
      );
      this.logger.debug(`Retrieved <${ documents.length }> trash entries`);
      return { documents };
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

  public async trash_recover(path:string, destination:string):Promise<void> {
    const sourceSanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const destinationSanitizedPath:string = this.environmentService.sanitizeDocumentPath(destination);
    if ( sourceSanitizedPath.includes('/') ) {
      throw new BadRequestException(`Trash entry <${ sourceSanitizedPath }> must be top-level`);
    }
    const trashEntryMatch:RegExpMatchArray | null = sourceSanitizedPath.match(/^(\d+)_(.+)$/);
    if ( ! trashEntryMatch ) {
      throw new BadRequestException(`Invalid trash entry <${ sourceSanitizedPath }>`);
    }
    const sourceDirectoryPath:string = this.environmentService.getDocumentDirectoryPath(sourceSanitizedPath, true);
    const destinationParentPath:string = this.environmentService.getDocumentDirectoryPath(destinationSanitizedPath);
    const destinationDirectoryPath:string = join(destinationParentPath, trashEntryMatch[ 2 ]);
    const sourceStats:Stats | null = await stat(sourceDirectoryPath).catch(():null => null);
    if ( ! sourceStats?.isDirectory() ) {
      this.logger.warn(`Trash entry directory <${ sourceDirectoryPath }> does not exist`);
      throw new NotFoundException(`Trash entry <${ sourceSanitizedPath }> not found`);
    }
    const destinationStats:Stats | null = await stat(destinationDirectoryPath).catch(():null => null);
    if ( destinationStats ) {
      throw new ConflictException(`Document <${ destinationSanitizedPath }/${ trashEntryMatch[ 2 ] }> already exists`);
    }
    try {
      await mkdir(destinationParentPath, { recursive: true });
      await access(destinationParentPath, constants.W_OK);
      await access(sourceDirectoryPath, constants.W_OK);
      await rename(sourceDirectoryPath, destinationDirectoryPath);
      this.logger.debug(`Trash entry <${ sourceDirectoryPath }> recovered to <${ destinationDirectoryPath }>`);
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

  public async trash_remove(path:string):Promise<void> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    if ( sanitizedPath.includes('/') || ! /^\d+_.+$/.test(sanitizedPath) ) {
      throw new BadRequestException(`Invalid trash entry <${ sanitizedPath }>`);
    }
    const trashRoot:string = this.environmentService.getTrashRoot();
    const entryDirectoryPath:string = join(trashRoot, sanitizedPath);
    const entryStats:Stats | null = await stat(entryDirectoryPath).catch(():null => null);
    if ( ! entryStats?.isDirectory() ) {
      this.logger.warn(`Trash entry directory <${ entryDirectoryPath }> does not exist`);
      throw new NotFoundException(`Trash entry <${ sanitizedPath }> not found`);
    }
    try {
      await access(trashRoot, constants.W_OK);
      await access(entryDirectoryPath, constants.W_OK);
      await rm(entryDirectoryPath, { recursive: true });
      this.logger.debug(`Trash entry <${ entryDirectoryPath }> permanently removed`);
    } catch ( error ) {
      this.handleFsError(error);
    }
  }

}

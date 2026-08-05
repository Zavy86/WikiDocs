import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { DocumentService } from "src/services/document.service";
import { DatasetsService } from "src/services/datasets.service";
import { EnvironmentService } from "src/services/environment.service";
import { MetadataSchema, PinnedSchema, PinSchema } from "src/schemas";

@Injectable()
export class PinnedService extends DatasetsService {

  private readonly logger:Logger = new Logger('PinnedService');

  constructor(
    protected readonly environmentService:EnvironmentService,
    @Inject(forwardRef(() => DocumentService))
    private readonly documentService:DocumentService
  ) {
    super(environmentService.getPinnedPath());
  }

  private async retrievePinnedEntries():Promise<PinSchema[]> {
    const parsed:PinSchema[] = await this.retrieveArrayFromDataset(PinSchema);
    if ( parsed.some((entry:PinSchema):boolean => ( typeof entry.path !== 'string' )) ) {
      this.logger.error(`Invalid pinned dataset format, expected { path:string }[]`);
      throw new InternalServerErrorException(`Invalid pinned dataset format`);
    }
    return parsed;
  }

  private async resolvePinnedMetadata(pinned:PinSchema[]):Promise<{ documents:MetadataSchema[]; validPinnedEntries:PinSchema[] }> {
    const metadata:MetadataSchema[] = [];
    const validEntries:PinSchema[] = [];
    for ( const entry of pinned ) {
      const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(entry.path);
      if ( ! await this.documentService.checkIfDocumentExists(sanitizedPath) ) {
        this.logger.warn(`Pinned path <${ sanitizedPath }> not found and will be ignored`);
        continue;
      }
      metadata.push(await this.documentService.buildDocumentMetadata(sanitizedPath));
      validEntries.push({ path: sanitizedPath });
    }
    return { documents: metadata, validPinnedEntries: validEntries };
  }

  public async retrieve():Promise<PinnedSchema> {
    const pinned:PinSchema[] = await this.retrievePinnedEntries();
    const { documents } = await this.resolvePinnedMetadata(pinned);
    this.logger.debug(`Retrieved <${ documents.length }> pinned documents:\n${ JSON.stringify(documents.map((entry:PinSchema):string => entry.path), null, 2) }`);
    return { documents };
  }

  public async isPinned(path:string):Promise<boolean> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const pinned:PinSchema[] = await this.retrievePinnedEntries();
    const { validPinnedEntries } = await this.resolvePinnedMetadata(pinned);
    return validPinnedEntries.some((entry:PinSchema):boolean => entry.path === sanitizedPath);
  }

  public async store(path:string):Promise<void> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    if ( ! await this.documentService.checkIfDocumentExists(sanitizedPath) ) {
      throw new BadRequestException(`Document <${ sanitizedPath }> not found`);
    }
    const actuallyPinnedEntries:PinSchema[] = await this.retrievePinnedEntries();
    const { validPinnedEntries } = await this.resolvePinnedMetadata(actuallyPinnedEntries);
    if ( validPinnedEntries.some((entry:PinSchema):boolean => entry.path === sanitizedPath) ) {
      this.logger.warn(`Path <${ sanitizedPath }> already pinned`);
      throw new BadRequestException(`Document <${ sanitizedPath }> already pinned`);
    }
    await this.storeArrayToDataset([ ...validPinnedEntries, { path: sanitizedPath } ], PinSchema);
    this.logger.debug(`Document <${ sanitizedPath }> successfully pinned`);
  }

  public async sort(path:string, sorting:number):Promise<void> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    if ( ! Number.isInteger(sorting) ) {
      this.logger.warn(`Sorting <${ String(sorting) }> is not a valid integer`);
      throw new BadRequestException(`Sorting must be an integer number`);
    }
    const actuallyPinnedEntries:PinSchema[] = await this.retrievePinnedEntries();
    const index:number = actuallyPinnedEntries.findIndex((entry:PinSchema):boolean => entry.path === sanitizedPath);
    if ( index < 0 ) {
      this.logger.warn(`Pinned path <${ sanitizedPath }> was not found`);
      throw new NotFoundException(`Document <${ sanitizedPath }> is not pinned`);
    }
    if ( sorting < 1 || sorting > actuallyPinnedEntries.length ) {
      this.logger.warn(`Sorting <${ sorting }> is out of range [1, ${ actuallyPinnedEntries.length }]`);
      throw new BadRequestException(`Sorting must be between 1 and ${ actuallyPinnedEntries.length }`);
    }
    const target:number = sorting - 1;
    if ( index === target ) { return; }
    const [ moved ] = actuallyPinnedEntries.splice(index, 1);
    actuallyPinnedEntries.splice(target, 0, moved);
    await this.storeArrayToDataset(actuallyPinnedEntries, PinSchema);
    this.logger.debug(`Document <${ sanitizedPath }> successfully sorted`);
  }

  public async remove(path:string):Promise<void> {
    const sanitizedPath:string = this.environmentService.sanitizeDocumentPath(path);
    const actuallyPinnedEntries:PinSchema[] = await this.retrievePinnedEntries();
    const index:number = actuallyPinnedEntries.findIndex((entry:PinSchema):boolean => entry.path === sanitizedPath);
    if ( index < 0 ) {
      this.logger.warn(`Pinned path <${ sanitizedPath }> was not found`);
      throw new NotFoundException(`Document <${ sanitizedPath }> is not pinned`);
    }
    actuallyPinnedEntries.splice(index, 1);
    await this.storeArrayToDataset(actuallyPinnedEntries, PinSchema);
    this.logger.debug(`Document <${ sanitizedPath }> successfully unpinned`);
  }

}

import matter from 'gray-matter';
import { readdir, readFile } from "node:fs/promises";
import { Dirent } from "node:fs";
import { join } from "node:path";
import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MetadataSchema } from "src/schemas/metadata.schema";
import { SearchResultSchema, SearchSchema } from "src/schemas/search.schema";
import { DocumentService } from "src/services/document.service";
import { EnvironmentService } from "src/services/environment.service";

@Injectable()
export class SearchService {

  private readonly logger:Logger = new Logger('SearchService');

  constructor(
    private readonly documentService:DocumentService,
    private readonly environmentService:EnvironmentService
  ) {}

  private async retrieveDocumentPaths(directory:string, path:string = ''):Promise<string[]> {
    let entries:Dirent[];
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch ( error ) {
      this.logger.fatal(`Unable to read documents directory <${ directory }>: ${ error instanceof Error ? error.message : String(error) }`);
      throw new InternalServerErrorException('Unable to search documents');
    }
    const documentPaths:string[] = entries
      .some((entry:Dirent):boolean => entry.isFile() && entry.name === EnvironmentService.CONTENT_FILE) ? [ path ] : [];
    const childDirectories:Dirent[] = entries
      .filter((entry:Dirent):boolean => entry.isDirectory())
      .filter((entry:Dirent):boolean => entry.name.toLowerCase() !== EnvironmentService.VERSIONS_DIRECTORY);
    const descendants:string[][] = await Promise.all(
      childDirectories.map((entry:Dirent):Promise<string[]> => {
        const childPath:string = [ path, entry.name ].filter(Boolean).join('/');
        return this.retrieveDocumentPaths(join(directory, entry.name), childPath);
      })
    );
    return [ ...documentPaths, ...descendants.flat() ];
  }

  private buildQueryPattern(query:string):RegExp {
    const escaped:string = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![\\p{L}\\p{N}_])${ escaped }(?![\\p{L}\\p{N}_])`, 'giu');
  }

  private findSentenceBounds(content:string, matchIndex:number, matchLength:number):{ start:number; end:number } {
    let start:number = matchIndex;
    while ( start > 0 ) {
      const previous:string = content[ start - 1 ];
      if ( previous === '\n' ) { break; }
      if ( ( previous === '.' || previous === '!' || previous === '?' ) && ( start === content.length || /\s/u.test(content[ start ]) ) ) { break; }
      start--;
    }
    let end:number = matchIndex + matchLength;
    while ( end < content.length ) {
      const current:string = content[ end ];
      if ( current === '\n' ) { break; }
      end++;
      if ( ( current === '.' || current === '!' || current === '?' ) && ( end === content.length || /\s/u.test(content[ end ]) ) ) { break; }
    }
    while ( start < end && /\s/u.test(content[ start ]) ) { start++; }
    while ( end > start && /\s/u.test(content[ end - 1 ]) ) { end--; }
    return { start, end };
  }

  private buildHighlight(sentence:string, matchStart:number, matchLength:number):string {
    const maximumLength:number = 180;
    const markerLength:number = 4;
    const rawBudget:number = maximumLength - markerLength;
    let start:number = 0;
    let end:number = sentence.length;
    if ( sentence.length > rawBudget && matchLength <= rawBudget - 2 ) {
      const windowLength:number = rawBudget - 2;
      start = Math.max(0, Math.min(matchStart - Math.floor(( windowLength - matchLength ) / 2), sentence.length - windowLength));
      end = start + windowLength;
    }
    const prefix:string = start > 0 ? '…' : '';
    const suffix:string = end < sentence.length ? '…' : '';
    const excerpt:string = sentence.slice(start, end);
    const highlightStart:number = matchStart - start;
    const highlighted:string = `${ excerpt.slice(0, highlightStart) }==${ excerpt.slice(highlightStart, highlightStart + matchLength) }==${ excerpt.slice(highlightStart + matchLength) }`;
    return `${ prefix }${ highlighted }${ suffix }`;
  }

  private extractHighlights(content:string, query:string):string[] {
    const pattern:RegExp = this.buildQueryPattern(query);
    return Array.from(content.matchAll(pattern)).map((match:RegExpMatchArray):string => {
      const matchIndex:number = match.index ?? 0;
      const { start, end } = this.findSentenceBounds(content, matchIndex, match[ 0 ].length);
      return this.buildHighlight(content.slice(start, end), matchIndex - start, match[ 0 ].length);
    });
  }

  private async searchDocument(path:string, query:string):Promise<SearchResultSchema | null> {
    const file:string = this.environmentService.getDocumentContentPath(path);
    let raw:string;
    try {
      raw = await readFile(file, 'utf-8');
    } catch ( error ) {
      this.logger.fatal(`Unable to read document <${ file }>: ${ error instanceof Error ? error.message : String(error) }`);
      throw new InternalServerErrorException('Unable to search documents');
    }
    const highlights:string[] = this.extractHighlights(matter(raw).content.replace(/\r\n?/g, '\n'), query);
    if ( highlights.length === 0 ) { return null; }
    const metadata:MetadataSchema = await this.documentService.buildDocumentMetadata(path);
    return { metadata, highlights };
  }

  private async searchDocuments(paths:string[], query:string):Promise<Array<SearchResultSchema | null>> {
    const maximumConcurrentSearches:number = 8;
    const results:Array<SearchResultSchema | null> = new Array(paths.length).fill(null);
    let nextIndex:number = 0;
    const worker = async ():Promise<void> => {
      while ( nextIndex < paths.length ) {
        const index:number = nextIndex++;
        results[ index ] = await this.searchDocument(paths[ index ], query);
      }
    };
    const workerCount:number = Math.min(maximumConcurrentSearches, paths.length);
    await Promise.all(Array.from({ length: workerCount }, ():Promise<void> => worker()));
    return results;
  }

  public async search(rawQuery:string):Promise<SearchSchema> {
    const query:string = rawQuery?.trim() ?? '';
    if ( ! query ) { throw new BadRequestException('Search query must not be empty'); }
    const paths:string[] = ( await this.retrieveDocumentPaths(this.environmentService.getDocumentsRoot()) ).sort((left:string, right:string):number => left.localeCompare(right));
    const searched:Array<SearchResultSchema | null> = await this.searchDocuments(paths, query);
    return { results: searched.filter((result:SearchResultSchema | null):result is SearchResultSchema => result !== null) };
  }

}

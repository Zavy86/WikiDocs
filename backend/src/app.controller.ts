import { Body, Controller, DefaultValuePipe, Delete, Get, Head, HttpCode, ParseBoolPipe, Patch, Post, Put, Query, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiProduces, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { Response } from 'express';
import { Authorizations, JwtAccount, JwtToken, Public } from "src/app.decorators";
import type { SyncStream } from "src/services";
import { AccountsService, AttachmentStream, DocumentService, PinnedService, ReleaseService, SearchService, SettingsService, SyncService, SystemService } from "src/services";
import {
  AccountsSchema,
  ActionsSchema,
  AuthenticateSchema,
  ContentSchema,
  DocumentSchema,
  InformationSchema,
  InitializationSchema,
  JwtSchema,
  PinnedSchema,
  ProfileSchema,
  ReleaseSchema,
  SearchSchema,
  SettingsSchema,
  SnapshotSchema,
  TokenSchema,
  TrashSchema,
  TreeSchema
} from "src/schemas";

@Controller()
@ApiTags('Endpoints')
export class AppController {

  constructor(
    private readonly accountsService:AccountsService,
    private readonly documentService:DocumentService,
    private readonly pinnedService:PinnedService,
    private readonly releaseService:ReleaseService,
    private readonly searchService:SearchService,
    private readonly systemService:SystemService,
    private readonly settingsService:SettingsService,
    private readonly syncService:SyncService,
  ) {}

  @Public()
  @Get('/health')
  @HttpCode(204)
  @ApiOperation({ summary: 'Check service availability' })
  public health():Promise<void> {
    return this.systemService.health();
  }

  @Public()
  @Get('/information')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve service information' })
  public information():Promise<InformationSchema> {
    return this.systemService.information();
  }

  @ApiBearerAuth()
  @Authorizations('manage')
  @Get('release')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve the installed and latest release versions' })
  @ApiOkResponse({ type: ReleaseSchema })
  @ApiQuery({ name: 'force', required: false, default: false })
  public release_retrieve(
    @Query('force') force:boolean,
  ):Promise<ReleaseSchema> {
    return this.releaseService.retrieve(force);
  }

  @Public()
  @Post('/initialize')
  @HttpCode(204)
  @ApiOperation({ summary: 'Initialize the datasets' })
  public initialize(
    @Body() request:InitializationSchema
  ):Promise<void> {
    return this.systemService.initialize(request);
  }

  @ApiBearerAuth()
  @Head('token')
  @ApiOperation({ summary: 'Check given bearer token validity' })
  @HttpCode(204)
  public token(
    @JwtToken() token:TokenSchema,
  ):Promise<void> {
    return this.accountsService.verify(token);
  }

  @Public()
  @Get('guest')
  @ApiOperation({ summary: 'Try to get a guest session token' })
  @HttpCode(200)
  public guest():Promise<JwtSchema> {
    return this.accountsService.guest();
  }

  @Public()
  @Get('local')
  @ApiOperation({ summary: 'Try to get a local session token' })
  @HttpCode(200)
  public local():Promise<JwtSchema> {
    return this.accountsService.local();
  }

  @Public()
  @Post('authenticate')
  @ApiOperation({ summary: 'Authenticate to get a session token' })
  @HttpCode(200)
  public authenticate(
    @Body() request:AuthenticateSchema,
  ):Promise<JwtSchema> {
    return this.accountsService.authenticate(request);
  }

  @ApiBearerAuth()
  @Patch('profile')
  @ApiOperation({ summary: 'Update your profile and password' })
  @HttpCode(204)
  public profile(
    @JwtAccount() account:string,
    @Body() request:ProfileSchema,
  ):Promise<void> {
    return this.accountsService.profile(account, request);
  }

  @Public()
  @Get('settings')
  @ApiOperation({ summary: 'Retrieve system settings' })
  @HttpCode(200)
  public settings_retrieve():Promise<SettingsSchema> {
    return this.settingsService.retrieve();
  }

  @ApiBearerAuth()
  @Authorizations('manage')
  @Put('settings')
  @ApiOperation({ summary: 'Store system settings' })
  @HttpCode(204)
  public settings_store(
    @Body() request:SettingsSchema,
  ):Promise<void> {
    return this.settingsService.store(request);
  }

  @ApiBearerAuth()
  @Authorizations('manage')
  @Get('/accounts')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve authorized accounts' })
  public accounts_retrieve():Promise<AccountsSchema> {
    return this.accountsService.retrieve();
  }

  @ApiBearerAuth()
  @Authorizations('manage')
  @Post('/accounts')
  @HttpCode(204)
  @ApiOperation({ summary: 'Store authorized accounts' })
  public accounts_store(
    @Body() request:AccountsSchema,
  ):Promise<void> {
    return this.accountsService.store(request);
  }

  @ApiBearerAuth()
  @Authorizations('manage')
  @Delete('/accounts')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete authorized account' })
  @ApiQuery({ name: 'account', required: true })
  public accounts_remove(
    @Query('account') account:string,
  ):Promise<void> {
    return this.accountsService.remove(account);
  }

  @ApiBearerAuth()
  @Authorizations('read')
  @Get('/pinned')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve documents pinned' })
  public pinned_retrieve():Promise<PinnedSchema> {
    return this.pinnedService.retrieve();
  }

  @ApiBearerAuth()
  @Authorizations('write')
  @Post('/pinned')
  @HttpCode(204)
  @ApiOperation({ summary: 'Pin a document' })
  @ApiQuery({ name: 'path', required: true })
  public pinned_store(
    @Query('path') path:string,
  ):Promise<void> {
    return this.pinnedService.store(path);
  }

  @ApiBearerAuth()
  @Authorizations('write')
  @Patch('/pinned')
  @HttpCode(204)
  @ApiOperation({ summary: 'Sort a pinned document' })
  @ApiQuery({ name: 'path', required: true })
  @ApiQuery({ name: 'sorting', required: true })
  public pinned_sort(
    @Query('path') path:string,
    @Query('sorting') sorting:number,
  ):Promise<void> {
    return this.pinnedService.sort(path, sorting);
  }

  @ApiBearerAuth()
  @Authorizations('write')
  @Delete('/pinned')
  @HttpCode(204)
  @ApiOperation({ summary: 'Unpin a document' })
  @ApiQuery({ name: 'path', required: true })
  public pinned_remove(
    @Query('path') path:string,
  ):Promise<void> {
    return this.pinnedService.remove(path);
  }

  @ApiBearerAuth()
  @Authorizations('read')
  @Get('search')
  @HttpCode(200)
  @ApiOperation({ summary: 'Search for documents' })
  @ApiQuery({ name: 'query', required: true })
  public search(
    @Query('query') query:string,
  ):Promise<SearchSchema> {
    return this.searchService.search(query);
  }

  @ApiBearerAuth()
  @Authorizations('read')
  @Get('tree')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve direct children of a tree path' })
  @ApiQuery({ name: 'path', required: true })
  public tree(
    @Query('path') path:string,
  ):Promise<TreeSchema> {
    return this.documentService.tree(path);
  }

  @ApiBearerAuth()
  @Authorizations('read')
  @Get('document')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve a document' })
  @ApiQuery({ name: 'path', required: true })
  public document_retrieve(
    @Query('path') path:string,
  ):Promise<DocumentSchema> {
    return this.documentService.document_retrive(path);
  }

  @ApiBearerAuth()
  @Authorizations('write')
  @Post('document')
  @HttpCode(204)
  @ApiOperation({ summary: 'Store a document' })
  @ApiQuery({ name: 'path', required: true })
  public document_store(
    @Query('path') path:string,
    @JwtToken() token:TokenSchema,
    @Body() content:ContentSchema,
  ):Promise<void> {
    return this.documentService.document_store(path, token, content);
  }

  @ApiBearerAuth()
  @Authorizations('write')
  @Patch('document')
  @HttpCode(204)
  @ApiOperation({ summary: 'Move a document' })
  @ApiQuery({ name: 'path', required: true })
  @ApiQuery({ name: 'destination', required: true })
  public document_move(
    @Query('path') path:string,
    @Query('destination') destination:string,
  ):Promise<void> {
    return this.documentService.document_move(path, destination);
  }

  @ApiBearerAuth()
  @Authorizations('delete')
  @Delete('document')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a document' })
  @ApiQuery({ name: 'path', required: true })
  @Authorizations('delete')
  public document_remove(
    @Query('path') path:string,
  ):Promise<void> {
    return this.documentService.document_remove(path);
  }

  @ApiBearerAuth()
  @Authorizations('write')
  @Get('version')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve a document version' })
  @ApiQuery({ name: 'path', required: true })
  @ApiQuery({ name: 'timestamp', required: true })
  public version_retrieve(
    @Query('path') path:string,
    @Query('timestamp') timestamp:string,
  ):Promise<ContentSchema> {
    return this.documentService.version_retrieve(path, timestamp);
  }

  @ApiBearerAuth()
  @Authorizations('delete')
  @Delete('version')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a document version' })
  @ApiQuery({ name: 'path', required: true })
  @ApiQuery({ name: 'timestamp', required: true })
  public version_remove(
    @Query('path') path:string,
    @Query('timestamp') timestamp:string,
  ):Promise<void> {
    return this.documentService.version_remove(path, timestamp);
  }

  @Public()
  @Get('attachment')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve an attachment' })
  @ApiQuery({ name: 'path', required: true })
  @ApiQuery({ name: 'file', required: true })
  @ApiQuery({ name: 'token', required: true })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  public async attachment_retrieve(
    @Query('path') path:string,
    @Query('file') file:string,
    @Query('token') token:string,
    @Res({ passthrough: true }) response:Response,
  ):Promise<StreamableFile> {
    const attachment:AttachmentStream = await this.documentService.attachment_retrive(path, file, token);
    const escapedFileName:string = attachment.fileName.replace(/"/g, '\\"');
    response.type(attachment.fileType);
    response.setHeader('Content-Length', attachment.contentLength.toString());
    response.setHeader('Content-Disposition', `inline; filename="${ escapedFileName }"`);
    return new StreamableFile(attachment.stream);
  }

  @ApiBearerAuth()
  @Authorizations('write')
  @Post('attachment')
  @HttpCode(204)
  @ApiOperation({ summary: 'Store an attachment' })
  @ApiQuery({ name: 'path', required: true })
  @ApiQuery({ name: 'file', required: true })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  public attachment_store(
    @Query('path') path:string,
    @Query('file') file:string,
    @UploadedFile() uploaded:{ buffer:Buffer },
  ):Promise<void> {
    return this.documentService.attachment_store(path, file, uploaded);
  }

  @ApiBearerAuth()
  @Authorizations('delete')
  @Delete('attachment')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove an attachment' })
  @ApiQuery({ name: 'path', required: true })
  @ApiQuery({ name: 'file', required: true })
  public attachment_remove(
    @Query('path') path:string,
    @Query('file') file:string,
  ):Promise<void> {
    return this.documentService.attachment_remove(path, file);
  }

  @ApiBearerAuth()
  @Authorizations('delete')
  @Get('trash')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve deleted documents' })
  public trash_retrieve():Promise<TrashSchema> {
    return this.documentService.trash_retrieve();
  }

  @ApiBearerAuth()
  @Authorizations('delete')
  @Patch('trash')
  @HttpCode(204)
  @ApiOperation({ summary: 'Restore a deleted document' })
  @ApiQuery({ name: 'path', required: true })
  @ApiQuery({ name: 'destination', required: true })
  public trash_recover(
    @Query('path') path:string,
    @Query('destination') destination:string,
  ):Promise<void> {
    return this.documentService.trash_recover(path, destination);
  }

  @ApiBearerAuth()
  @Authorizations('delete')
  @Delete('trash')
  @HttpCode(204)
  @ApiOperation({ summary: 'Permanently remove a deleted document' })
  @ApiQuery({ name: 'path', required: true })
  public trash_remove(
    @Query('path') path:string,
  ):Promise<void> {
    return this.documentService.trash_remove(path);
  }

  @ApiBearerAuth()
  @Authorizations('sync')
  @Get('sync')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve current document snapshot' })
  public sync_snapshot():Promise<SnapshotSchema> {
    return this.syncService.sync_snapshot();
  }

  @ApiBearerAuth()
  @Authorizations('sync')
  @Post('sync')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send actions and retrieve changes' })
  @ApiProduces('application/zip')
  @ApiOkResponse({ content: { 'application/zip': { schema: { type: 'string', format: 'binary' } } } })
  public async sync_actions(
    @Body() actions:ActionsSchema,
    @Res({ passthrough: true }) response:Response,
  ):Promise<StreamableFile> {
    const archive:SyncStream = await this.syncService.sync_actions(actions);
    response.type('application/zip');
    response.setHeader('Content-Length', archive.contentLength.toString());
    response.setHeader('Content-Disposition', 'attachment; filename="sync.zip"');
    archive.stream.once('close', ():void => void archive.cleanup());
    archive.stream.once('error', ():void => void archive.cleanup());
    return new StreamableFile(archive.stream);
  }

  @ApiBearerAuth()
  @Authorizations('sync')
  @Put('sync')
  @HttpCode(204)
  @ApiOperation({ summary: 'Apply uploaded sync archive' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  public sync_import(
    @UploadedFile() uploaded:{ buffer:Buffer },
  ):Promise<void> {
    return this.syncService.sync_import(uploaded);
  }
}

import { Controller, Get, HttpCode, Ip, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LatestSchema, StatsSchema } from 'src/app.schemas';
import { AppService } from 'src/app.service';

@Controller()
@ApiTags('Endpoints')
export class AppController {

  constructor(
    private readonly appService:AppService
  ) {}

  @Get('latest')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve the latest version and optionally track anonymous metrics' })
  @ApiOkResponse({ type: LatestSchema })
  @ApiQuery({ name: 'version', required: false })
  @ApiQuery({ name: 'mode', required: false })
  latest(
    @Ip() ip:string,
    @Query('version') version?:string,
    @Query('mode') mode?:string
  ):Promise<LatestSchema> {
    return this.appService.latest(ip, version, mode);
  }

  @Get('stats')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve the latest complete daily and weekly metrics' })
  @ApiOkResponse({ type: StatsSchema })
  stats():Promise<StatsSchema> {
    return this.appService.stats();
  }

}

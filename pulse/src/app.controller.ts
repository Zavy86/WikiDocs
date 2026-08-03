import { Controller, Get, HttpCode, Ip, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
  @ApiQuery({ name: 'version', required: false })
  @ApiQuery({ name: 'mode', required: false })
  latest(
    @Ip() ip:string,
    @Query('version') version?:string,
    @Query('mode') mode?:string
  ):string {
    return this.appService.latest(ip, version, mode);
  }

}

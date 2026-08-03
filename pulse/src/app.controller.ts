import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('Endpoints')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('latest')
  latest(): string {
    return this.appService.latest();
  }

}

import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import type { ReleaseContract } from '@shared/contracts';

export class ReleaseSchema implements ReleaseContract {

  @Expose()
  @ApiProperty({ example: '1.2.3' })
  current:string;

  @Expose()
  @ApiProperty({ example: '2.3.4' })
  latest:string;

}

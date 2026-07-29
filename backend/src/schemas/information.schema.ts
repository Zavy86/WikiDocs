import { IsIn } from "class-validator";
import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { InformationContract } from "@shared/contracts";

export class InformationSchema implements InformationContract {

  @Expose()
  @IsIn([ 'local', 'private', 'public' ])
  @ApiProperty({ enum: [ 'local', 'private', 'public' ], example: 'public' })
  mode:'local' | 'private' | 'public';

  @Expose()
  @ApiProperty({ example: true })
  initialized:boolean;

  @Expose()
  @ApiProperty({ example: 'wikidocs-backend' })
  service:string;

  @Expose()
  @ApiProperty({ example: '1.0.0' })
  version:string;

  @Expose()
  @ApiProperty({ example: '127.0.0.1' })
  host:string;

  @Expose()
  @ApiProperty({ example: 'linux' })
  platform:string;

  @Expose()
  @ApiProperty({ example: 'v22.11.0' })
  engine:string;

  @Expose()
  @ApiProperty({ example: 40720 })
  pid:number;

  @Expose()
  @ApiProperty({ example: 2939 })
  uptime:number;

  @Expose()
  @ApiProperty({ example: 27607040 })
  memory:number;

}

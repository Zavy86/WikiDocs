import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class PinSchema {

  @Expose()
  @ApiProperty({ example: '/world/europe/italy' })
  path:string;

}

import { Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ContentContract } from "@shared/contracts";

export class ContentSchema implements ContentContract {

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Document source code' })
  raw:string;

}

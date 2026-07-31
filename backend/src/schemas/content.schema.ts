import { Expose } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ContentContract } from "@shared/contracts";

export class ContentSchema implements ContentContract {

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Document source code' })
  raw:string;

  @Expose()
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ example: true, description: 'Create a snapshot before overwriting an existing document.' })
  versioning?:boolean;

}

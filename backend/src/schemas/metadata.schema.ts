import { Expose } from "class-transformer";
import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { MetadataContract } from "@shared/contracts";

export class MetadataSchema implements MetadataContract {

  @Expose()
  @ApiProperty({ example: "/world/europe/italy/rome" })
  path:string;

  @Expose()
  @ApiProperty({ example: "Italy, Rome" })
  title:string;

  @Expose()
  @ApiProperty({ example: '2025-09-18T00:00:00.000Z', type: String, format: "date-time" })
  timestamp:string;

  @Expose()
  @ApiProperty({ example: "John Doe <john.doe@wikidocs.app>" })
  author:string;

  @Expose()
  @IsString({ each: true })
  @ApiProperty({ type: [ String ], example: [ "district" ] })
  tags:string[];
}

import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { SearchContract } from "@shared/contracts";
import { MetadataSchema } from "src/schemas/metadata.schema";

export class SearchResultSchema {

  @Type(() => MetadataSchema)
  @ApiProperty({ type: () => MetadataSchema })
  metadata:MetadataSchema;

  @ApiProperty({ type: [ String ], example: [ 'Visit ==Rome== for its historic centre.' ] })
  highlights:string[];

}

export class SearchSchema implements SearchContract {

  @Type(() => SearchResultSchema)
  @ApiProperty({ type: () => SearchResultSchema, isArray: true })
  results:SearchResultSchema[];

}

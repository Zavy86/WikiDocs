import { Expose, Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PinnedContract } from "@shared/contracts";
import { MetadataSchema } from "src/schemas";

export class PinnedSchema implements PinnedContract {

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MetadataSchema)
  @ApiProperty({ type: [ MetadataSchema ] })
  documents:MetadataSchema[];

}

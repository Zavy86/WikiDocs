import { Expose, Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { TrashContract } from "@shared/contracts";
import { MetadataSchema } from "src/schemas";

export class TrashSchema implements TrashContract {

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MetadataSchema)
  @ApiProperty({ type: [ MetadataSchema ] })
  documents:MetadataSchema[];

}

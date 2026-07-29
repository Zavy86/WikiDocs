import { Expose, Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { TreeContract } from "@shared/contracts";
import { MetadataSchema } from "src/schemas";

export class TreeSchema implements TreeContract {

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MetadataSchema)
  @ApiProperty({ type: [ MetadataSchema ] })
  leaves:MetadataSchema[];

}

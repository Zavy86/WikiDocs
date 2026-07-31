import { Expose, Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { DocumentContract } from "@shared/contracts";
import { AttachmentSchema, ContentSchema, MetadataSchema } from "src/schemas";

export class DocumentSchema implements DocumentContract {

  @Expose()
  @ApiProperty({ example: true })
  exists:boolean;

  @Expose()
  @ApiProperty({ example: true })
  pinned:boolean;

  @Expose()
  @ApiProperty({ type: () => MetadataSchema })
  metadata:MetadataSchema;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MetadataSchema)
  @ApiProperty({ type: [ MetadataSchema ] })
  children:MetadataSchema[];

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AttachmentSchema)
  @ApiProperty({ type: [ AttachmentSchema ] })
  attachments:AttachmentSchema[];

  @Expose()
  @ApiProperty({ type: [ String ], example: [ '1750000000000' ] })
  versions:string[];

  @Expose()
  @Type(() => ContentSchema)
  @ApiProperty({ type: () => ContentSchema })
  content:ContentSchema;
}

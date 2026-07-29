import { Expose, Type } from "class-transformer";
import { IsNumber, IsString, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { SnapshotContract } from "@shared/contracts";

export class SnapshotDocumentSchema {

  @Expose()
  @IsString()
  @ApiProperty({ example: "/world/europe/rome" })
  path:string;

  @Expose()
  @IsNumber()
  @ApiProperty({ example: 1721218000000 })
  time:number;

}

export class SnapshotSchema implements SnapshotContract {

  @Expose()
  @IsString()
  @ApiProperty({ example: "2026-07-24T11:19:12.343Z" })
  timestamp:string;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => SnapshotDocumentSchema)
  @ApiProperty({ type: [ SnapshotDocumentSchema ] })
  documents:SnapshotDocumentSchema[];

}

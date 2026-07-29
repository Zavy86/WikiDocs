import { Expose } from "class-transformer";
import { IsArray, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ActionsContract } from "@shared/contracts";

export class ActionsSchema implements ActionsContract {

  @Expose()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [ String ], example: [ "/world/europe/rome" ] })
  retrieve:string[];

  @Expose()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [ String ], example: [ "/world/europe/turin" ] })
  delete:string[];

}

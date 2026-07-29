import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { TokenContract } from "@shared/contracts";
import { IsArray, IsIn } from "class-validator";

export class TokenSchema implements TokenContract {

  @Expose()
  @ApiProperty({ example: 86400 })
  duration:number;

  @Expose()
  @ApiProperty({ example: "2025-09-18T00:00:00.000Z", type: String, format: "date-time" })
  generation:string;

  @Expose()
  @ApiProperty({ example: '2025-09-18T23:59:59.999Z', type: String, format: "date-time" })
  expiration:string;

  @Expose()
  @ApiProperty({ example: 'john.doe@wikidocs.app' })
  account:string;

  @Expose()
  @ApiProperty({ example: 'John' })
  firstname:string;

  @Expose()
  @ApiProperty({ example: 'Doe' })
  lastname:string;

  @Expose()
  @ApiProperty({ example: 'administrator' })
  role:string;

  @Expose()
  @IsArray()
  @IsIn([ "read", "write", "delete", "manage" ], { each: true })
  @ApiProperty({ example: [ "read" ], enum: [ "read", "write", "delete", "manage" ], isArray: true })
  authorizations:string[];

}

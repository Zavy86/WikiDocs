import { Expose } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ProfileContract } from "@shared/contracts";

export class ProfileSchema implements ProfileContract {

  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @ApiProperty({ example: 'John' })
  firstname:string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @ApiProperty({ example: 'Doe' })
  lastname:string;

  @Expose()
  @IsString()
  @IsOptional()
  @MaxLength(256)
  @ApiProperty({ example: 'P4$$w0Rd', default: 'undefined' })
  password?:null | string;

}

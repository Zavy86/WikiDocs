import { Expose } from "class-transformer";
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { AccountContract } from "@shared/contracts";

export class AccountSchema implements AccountContract {

  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(256)
  @ApiProperty({ example: 'john.doe@wikidocs.app' })
  account:string;

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
  @IsIn([ 'administrator', 'author', 'user' ])
  @ApiProperty({ enum: [ 'administrator', 'author', 'user' ], example: 'user' })
  role:"administrator" | "author" | "user";

  @Expose()
  @IsString()
  @IsOptional()
  @MaxLength(256)
  @ApiProperty({ example: 'P4$$w0Rd', default: 'undefined' })
  password?:null | string;

}

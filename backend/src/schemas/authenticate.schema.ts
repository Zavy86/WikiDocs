import { Expose } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { AuthenticateContract } from "@shared/contracts";

export class AuthenticateSchema implements AuthenticateContract {

  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(256)
  @ApiProperty({ example: 'john.doe@wikidocs.app' })
  account:string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @ApiProperty({ example: 'P4$$w0Rd' })
  password:string;

  @Expose()
  @IsNumber()
  @IsOptional()
  @Min(900)
  @Max(864000)
  @ApiProperty({ default: 86400 })
  duration?:number;

}

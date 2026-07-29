import { Expose } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MaxLength, ValidateIf } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { InitializationContract } from "@shared/contracts";

export class InitializationSchema implements InitializationContract {

  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @ApiProperty({ example: 'Awesome Wiki' })
  title:string;

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
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @ApiProperty({ example: 'P4$$w0Rd', nullable: true })
  @ValidateIf((_object:InitializationSchema, value:null | string):boolean => ( value !== null ))
  password:null | string;

}

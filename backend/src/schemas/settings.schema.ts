import { Expose } from "class-transformer";
import { IsIn, IsNotEmpty, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SettingsContract } from '@shared/contracts';

export class SettingsSchema implements SettingsContract {

  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @ApiProperty({ example: 'Awesome Wiki' })
  title:string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @ApiProperty({ example: 'The knowledge base' })
  subtitle:string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @ApiProperty({ example: 'Author or Company name' })
  owner:string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @ApiProperty({ example: 'Copyright 2026 © Company - All Rights Reserved' })
  notice:string;

  @Expose()
  @ValidateIf((_, value:string | null):boolean => value !== null)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  @ApiProperty({ example: 'Privacy policy banner content', nullable: true })
  privacy:string | null;

  @Expose()
  @IsIn([ 'ar', 'cs', 'de', 'en', 'es', 'fa', 'fr', 'hi', 'it', 'ja', 'nl', 'pl', 'pt', 'ru', 'zh' ])
  @ApiProperty({ enum: [ 'ar', 'cs', 'de', 'en', 'es', 'fa', 'fr', 'hi', 'it', 'ja', 'nl', 'pl', 'pt', 'ru', 'zh' ], example: 'en' })
  localization:'ar' | 'cs' | 'de' | 'en' | 'es' | 'fa' | 'fr' | 'hi' | 'it' | 'ja' | 'nl' | 'pl' | 'pt' | 'ru' | 'zh';

  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @ApiProperty({ example: 'Europe/Rome' })
  timezone:string;

  @Expose()
  @IsIn([ 'light', 'dark' ])
  @ApiProperty({ enum: [ 'light', 'dark' ], example: 'light' })
  template:'light' | 'dark';

  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(/^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
  @ApiProperty({ pattern: '^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$', example: '#4caf50' })
  color:string;

}

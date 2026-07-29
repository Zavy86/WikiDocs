import { Expose, Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { AccountsContract } from "@shared/contracts";
import { AccountSchema } from "src/schemas/account.schema";

export class AccountsSchema implements AccountsContract {

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountSchema)
  @ApiProperty({ type: [ AccountSchema ] })
  accounts:AccountSchema[];

}

import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { JwtContract } from "@shared/contracts";

export class JwtSchema implements JwtContract {

  @Expose()
  @ApiProperty({ example: 'eyJhbGc3...eyJkdXJh...ulF4NaXc...' })
  jwt:string;

}

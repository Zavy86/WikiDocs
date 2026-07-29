import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { AttachmentContract } from "@shared/contracts";

export class AttachmentSchema implements AttachmentContract {

  @Expose()
  @ApiProperty({ example: "/world/europe/italy/rome" })
  path:string;

  @Expose()
  @ApiProperty({ example: "report.pdf" })
  file:string;

  @Expose()
  @ApiProperty({ example: "L3dvcmxkL2V1cm9wZS9pdGFseS9yb21lfHJlcG9ydC5wZGZ8bWxjNm9z.LWh4Um11SU1UQm9Ea1JCWnR6R2c" })
  token:string;

}

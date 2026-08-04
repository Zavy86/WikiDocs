import { ApiProperty } from '@nestjs/swagger';

export class LatestSchema {

  @ApiProperty({ example: '1.2.3' })
  version:string;

}

export class DailyMetricSchema {

  @ApiProperty({ example: '2026-08-03' })
  date:string;

  @ApiProperty({ example: '1.2.3' })
  version:string;

  @ApiProperty({ enum: [ 'local', 'private', 'public' ], example: 'public' })
  mode:string;

  @ApiProperty({ example: 42 })
  count:number;

}

export class WeeklyMetricSchema {

  @ApiProperty({ example: '2026-W31' })
  week:string;

  @ApiProperty({ example: '1.2.3' })
  version:string;

  @ApiProperty({ enum: [ 'local', 'private', 'public' ], example: 'public' })
  mode:string;

  @ApiProperty({ example: 42 })
  count:number;

}

export class StatsSchema {

  @ApiProperty({ type: () => DailyMetricSchema, isArray: true })
  daily:DailyMetricSchema[];

  @ApiProperty({ type: () => WeeklyMetricSchema, isArray: true })
  weekly:WeeklyMetricSchema[];

}

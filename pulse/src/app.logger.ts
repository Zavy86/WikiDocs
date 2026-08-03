import { format } from 'date-fns';
import { ConsoleLogger } from '@nestjs/common';

export class AppLogger extends ConsoleLogger {
  protected getTimestamp():string {
    return format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import { DatasetsService } from "src/services/datasets.service";
import { EnvironmentService } from "src/services/environment.service";
import { AccountSchema, AccountsSchema, AuthenticateSchema, JwtSchema, ProfileSchema, TokenSchema } from "src/schemas";

@Injectable()
export class AccountsService extends DatasetsService {

  protected readonly logger:Logger = new Logger('AccountsService');

  constructor(
    private readonly jwtService:JwtService,
    protected readonly environmentService:EnvironmentService
  ) {
    super(environmentService.getAccountsPath());
  }

  private hashPassword(password:string):string {
    const secret:string = this.environmentService.getSecret();
    return createHmac('sha256', secret)
      .update(password)
      .digest('hex');
  }

  private verifyPassword(password:string, storedHash:string):boolean {
    const currentHash:string = this.hashPassword(password);
    const stored:Buffer = Buffer.from(storedHash, 'hex');
    const current:Buffer = Buffer.from(currentHash, 'hex');
    if ( stored.length !== current.length ) { return false; }
    return timingSafeEqual(stored, current);
  }

  public async retrieve():Promise<AccountsSchema> {
    if ( this.environmentService.getMode() === 'local' ) {
      this.logger.warn('Accounts management disabled in local mode');
      throw new BadRequestException('Accounts management is disabled in local mode');
    }
    const accounts:AccountSchema[] = await this.retrieveArrayFromDataset(AccountSchema);
    for ( const account of accounts ) { delete account.password; }
    this.logger.debug(`Retrieved <${ accounts.length }> accounts:\n${ JSON.stringify(accounts.map((entry:AccountSchema):string => entry.account), null, 2) }`);
    return { accounts }
  }

  public async store(request:AccountsSchema):Promise<void> {
    if ( this.environmentService.getMode() === 'local' ) {
      this.logger.warn('Accounts management disabled in local mode');
      throw new BadRequestException('Accounts management is disabled in local mode');
    }
    const accounts:AccountSchema[] = await this.retrieveArrayFromDataset(AccountSchema);
    for ( const account of request.accounts ) {
      const password:string | null = ( account.password ? this.hashPassword(account.password) : null );
      const existing:AccountSchema | undefined = accounts
        .find((entry:AccountSchema):boolean => ( entry.account === account.account ));
      if ( existing ) {
        existing.firstname = account.firstname;
        existing.lastname = account.lastname;
        existing.role = account.role;
        existing.password = password ?? existing.password;
      } else {
        if ( ! password ) {
          throw new BadRequestException(`Password is required for new account <${ account.account }>`);
        }
        account.password = password;
        accounts.push(account);
      }
    }
    await this.storeArrayToDataset(accounts, AccountSchema);
    this.logger.debug(`Stored <${ request.accounts.length }> accounts:\n${ JSON.stringify(request.accounts.map((entry:AccountSchema):string => entry.account), null, 2) }`);
  }

  public async remove(account:string):Promise<void> {
    if ( this.environmentService.getMode() === 'local' ) {
      this.logger.warn('Accounts management disabled in local mode');
      throw new BadRequestException('Accounts management is disabled in local mode');
    }
    const accounts:AccountSchema[] = await this.retrieveArrayFromDataset(AccountSchema);
    const index:number = accounts
      .findIndex((entry:AccountSchema):boolean => ( entry.account === account ));
    if ( index < 0 ) {
      this.logger.error(`Account <${ account }> was not found`);
      throw new NotFoundException(`Account <${ account }> not found`);
    }
    accounts.splice(index, 1);
    await this.storeArrayToDataset(accounts, AccountSchema);
    this.logger.debug(`Removed account <${ account }>`);
  }

  public async verify(token:TokenSchema):Promise<void> {
    if ( token.account !== 'guest' ) {
      const accounts:AccountSchema[] = await this.retrieveArrayFromDataset(AccountSchema);
      const account:AccountSchema | undefined = accounts
        .find((entry:AccountSchema):boolean => ( entry.account === token.account ));
      if ( ! account ) {
        this.logger.warn(`Account <${ token.account }> was not found`);
        throw new UnauthorizedException(`Account <${ token.account }> not found`);
      }
    }
    this.logger.debug(`Token for <${ token.account }> verified`);
  }

  public async guest():Promise<JwtSchema> {
    if ( this.environmentService.getMode() !== 'public' ) {
      this.logger.warn('Guest access denied');
      throw new UnauthorizedException('Guest access is enabled only in public mode');
    }
    const seconds:number = ( 60 * 60 * 24 );
    const token:TokenSchema = {
      duration: seconds,
      generation: new Date().toISOString(),
      expiration: new Date(Date.now() + ( seconds * 1000 )).toISOString(),
      account: 'guest',
      firstname: 'John',
      lastname: 'Doe',
      role: 'guest',
      authorizations: [ 'read' ]
    };
    const secret:string = this.environmentService.getSecret();
    this.logger.debug(`Token generated for <guest> with duration <${ seconds }s>`);
    return { jwt: await this.jwtService.signAsync(token, { secret }) };
  }

  public async local():Promise<JwtSchema> {
    if ( this.environmentService.getMode() !== 'local' ) {
      this.logger.warn('Local access denied');
      throw new UnauthorizedException('Local access is enabled only in local mode');
    }
    const accounts:AccountSchema[] = await this.retrieveArrayFromDataset(AccountSchema);
    const account:AccountSchema | undefined = accounts[ 0 ];
    if ( ! account ) {
      this.logger.warn('Local access denied due to empty accounts dataset');
      throw new UnauthorizedException('No account available for local access');
    }
    const seconds:number = ( 60 * 60 * 24 );
    const token:TokenSchema = {
      duration: seconds,
      generation: new Date().toISOString(),
      expiration: new Date(Date.now() + ( seconds * 1000 )).toISOString(),
      account: account.account,
      firstname: account.firstname,
      lastname: account.lastname,
      role: 'local',
      authorizations: [ 'read', 'write', 'delete', 'sync', 'manage' ]
    };
    const secret:string = this.environmentService.getSecret();
    this.logger.debug(`Local token generated for <${ token.account }> with duration <${ seconds }s>`);
    return { jwt: await this.jwtService.signAsync(token, { secret }) };
  }

  public async authenticate(request:AuthenticateSchema):Promise<JwtSchema> {
    if ( this.environmentService.getMode() === 'local' ) {
      this.logger.warn('Authentication is disabled in local mode');
      throw new BadRequestException('Authentication is disabled in local mode');
    }
    const accounts:AccountSchema[] = await this.retrieveArrayFromDataset(AccountSchema);
    const account:AccountSchema | undefined = accounts
      .find((entry:AccountSchema):boolean => ( entry.account === request.account ));
    if ( ! account || ! account.password || ! this.verifyPassword(request.password, account.password) ) {
      if ( ! account ) {
        this.logger.error(`Account <${ request.account }> was not found`);
      } else {
        this.logger.warn(`Authentication failed for account <${ request.account }>`);
      }
      throw new UnauthorizedException('Authentication failed');
    }
    const authorizations:string[] = [];
    switch ( account.role ) {
      case 'user':
        authorizations.push(...[ 'read' ]);
        break;
      case 'author':
        authorizations.push(...[ 'read', 'write', 'delete' ]);
        break;
      case 'administrator':
        authorizations.push(...[ 'read', 'write', 'delete', 'sync', 'manage' ]);
        break;
    }
    const seconds:number = Math.min(( request.duration ?? 900 ), 864000);
    const token:TokenSchema = {
      duration: seconds,
      generation: new Date().toISOString(),
      expiration: new Date(Date.now() + ( seconds * 1000 )).toISOString(),
      account: account.account,
      firstname: account.firstname,
      lastname: account.lastname,
      role: account.role,
      authorizations
    };
    const secret:string = this.environmentService.getSecret();
    this.logger.debug(`Token generated for <${ account.account }> with duration <${ seconds }s>`);
    return { jwt: await this.jwtService.signAsync(token, { secret }) };
  }

  public async profile(account:string, request:ProfileSchema):Promise<void> {
    const accounts:AccountSchema[] = await this.retrieveArrayFromDataset(AccountSchema);
    const existing:AccountSchema | undefined = accounts
      .find((entry:AccountSchema):boolean => ( entry.account === account ));
    if ( ! existing ) {
      this.logger.error(`Account <${ account }> was not found`);
      throw new NotFoundException(`Account <${ account }> not found`);
    }
    await this.store({
      accounts: [
        {
          account,
          firstname: request.firstname,
          lastname: request.lastname,
          role: existing.role,
          password: request.password
        }
      ]
    });
    this.logger.debug(`Profile updated for <${ account }>`);
  }

}

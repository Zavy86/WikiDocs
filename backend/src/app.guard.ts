import { plainToInstance } from 'class-transformer';
import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { EnvironmentService } from "src/services/environment.service";
import { TokenSchema } from "src/schemas";

@Injectable()
export class AppGuard implements CanActivate {

  private readonly logger:Logger = new Logger('AppGuards');

  constructor(
    private readonly environmentService:EnvironmentService,
    private readonly jwtService:JwtService,
    private readonly reflector:Reflector
  ) {}

  async canActivate(context:ExecutionContext):Promise<boolean> {
    if ( this.isPublic(context) ) {
      this.log(context, true, `Public (bypass all checks)`);
      return true;
    }
    await this.loadUserFromJWT(context);
    const requiredAuthorizations:string[] = this.getRequiredAuthorizations(context);
    if ( ! requiredAuthorizations.length ) {
      this.log(context, true, 'Authorized (checked only jwt)');
      return true;
    }
    const requestUserAuthorizations:string[] = this.getRequestUserAuthorizations(context);
    if ( requiredAuthorizations.some((authorization:string) => requestUserAuthorizations.includes(authorization)) ) {
      this.log(context, true, `Authorized (one of [ ${ requiredAuthorizations.join(', ') } ])`);
      return true;
    } else {
      this.log(context, false, `Unauthorized (any of [ ${ requiredAuthorizations.join(', ') } ])`);
      throw new UnauthorizedException(`You must have at least one of the following authorizations [ ${ requiredAuthorizations.join(', ') } ]..`);
    }
  }

  private isPublic(context:ExecutionContext):boolean {
    return this.reflector.getAllAndOverride<boolean>(
      'public',
      [ context.getHandler(), context.getClass() ]
    ) ?? false;
  }

  private async loadUserFromJWT(context:ExecutionContext):Promise<void> {
    const request = context.switchToHttp().getRequest();
    request[ 'user' ] = undefined;
    const [ type, token ] = request.headers[ 'authorization' ]?.split(' ') ?? [];
    if ( type !== 'Bearer' || ! token.length ) {
      this.log(context, false, 'JWT Undefined');
      throw new UnauthorizedException('You must provide an authentication token..');
    }
    const secret:string = this.environmentService.getSecret();
    await this.jwtService.verifyAsync(token, { secret })
      .catch(():void => {
        this.log(context, false, 'JWT Invalid');
        throw new UnauthorizedException('You must provide a valid authentication token..');
      })
      .then((payload):void => {
        const jwtPayload:TokenSchema = plainToInstance(TokenSchema, payload, { excludeExtraneousValues: true });
        if ( new Date() > new Date(jwtPayload.expiration) ) {
          this.log(context, false, 'JWT Expired');
          throw new UnauthorizedException('You must provide an unexpired authentication token..');
        }
        request[ 'user' ] = jwtPayload;
      });
  }

  private getRequiredAuthorizations(context:ExecutionContext):string[] {
    return this.reflector.getAllAndOverride<string[]>(
      'authorizations', [
        context.getHandler(),
        context.getClass()
      ]
    ) ?? [];
  }

  private getRequestUserAuthorizations(context:ExecutionContext):string[] {
    const request = context.switchToHttp().getRequest();
    return request[ 'user' ]?.authorizations ?? [];
  }

  private log(context:ExecutionContext, allowed:boolean, message:string):void {
    const { method, url } = context.switchToHttp().getRequest();
    const log:string = method + ':' + url + ' -> ';
    if ( allowed ) { this.logger.verbose(log + message); } else { this.logger.warn(log + message); }
  }

}

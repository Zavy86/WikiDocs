import { createParamDecorator, ExecutionContext, InternalServerErrorException, SetMetadata } from "@nestjs/common";
import { TokenSchema } from "src/schemas";

export const Public = () => SetMetadata('public', true);

export const Authenticated = () => SetMetadata('authorizations', []);

export const Authorizations = (...authorizations:string[]) => SetMetadata('authorizations', authorizations);

export const JwtToken = createParamDecorator(
  (data:undefined, context:ExecutionContext):TokenSchema => {
    const request = context.switchToHttp().getRequest();
    if ( request.user ) { return request.user as TokenSchema; }
    throw new InternalServerErrorException('Error retrieving payload from JWT');
  }
);

export const JwtAccount = createParamDecorator(
  (data:undefined, context:ExecutionContext):string => {
    const request = context.switchToHttp().getRequest();
    if ( request.user && 'account' in request.user ) { return request.user[ 'account' ]; }
    throw new InternalServerErrorException('Error retrieving account from JWT');
  }
);

export const JwtName = createParamDecorator(
  (data:undefined, context:ExecutionContext):string => {
    const request = context.switchToHttp().getRequest();
    if ( request.user && 'name' in request.user ) { return `${ request.user[ 'firstname' ] } ${ request.user[ 'firstname' ] }`; }
    throw new InternalServerErrorException('Error retrieving name from JWT');
  }
);

export const JwtRole = createParamDecorator(
  (data:undefined, context:ExecutionContext):string => {
    const request = context.switchToHttp().getRequest();
    if ( request.user && 'role' in request.user ) { return request.user[ 'role' ]; }
    throw new InternalServerErrorException('Error retrieving role from JWT');
  }
);

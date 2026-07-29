process.env.TZ = 'UTC';
import { description, title, version } from '../package.json';
import { join } from "node:path";
import { access, stat } from "node:fs/promises";
import { constants, Stats } from "node:fs";
import { NestFactory } from '@nestjs/core';
import { INestApplication, Logger, ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from 'src/app.module';
import { AppLogger } from 'src/app.logger';

const logger:Logger = new Logger('Bootstrap');

function crash(message:string):never {
  logger.fatal(message);
  process.exit(1);
}

async function checkEnvironmentOrCrash():Promise<void> {
  if ( ! process.env.MODE ) { crash(`Missing required MODE environment variable`); }
  if ( process.env.MODE !== 'local' && process.env.MODE !== 'private' && process.env.MODE !== 'public' ) {
    crash(`Invalid MODE environment variable value <${ process.env.MODE }>, expected 'local', 'private' or 'public'`);
  }
  if ( ! process.env.SECRET ) { crash(`Missing required SECRET environment variable`); }
  const datasets:string = process.env.DATASETS ?? '';
  if ( ! datasets ) { crash(`Missing required DATASETS environment variable`); }
  try {
    const datasetsStats:Stats = await stat(datasets);
    if ( ! datasetsStats.isDirectory() ) { crash(`DATASETS path <${ datasets }> is not a directory`); }
    await access(datasets, constants.W_OK);
  } catch ( error ) {
    const fsError:NodeJS.ErrnoException = error as NodeJS.ErrnoException;
    if ( fsError.code === 'ENOENT' ) { crash(`DATASETS directory <${ datasets }> does not exist`); }
    if ( fsError.code === 'EACCES' || fsError.code === 'EPERM' ) { crash(`DATASETS directory <${ datasets }> is not writable`); }
    crash(`DATASETS check failed for <${ datasets }>: ${ fsError.code ?? '00' } ${ fsError.message ?? String(error) }`);
  }
}

async function checkFrontendIfNeededOrCrash():Promise<void> {
  const frontend:string = process.env.FRONTEND ?? '';
  if ( ! frontend ) { return; }
  try {
    const frontendStats:Stats = await stat(frontend);
    if ( ! frontendStats.isDirectory() ) { crash(`FRONTEND path <${ frontend }> is not a directory`); }
    await access(frontend, constants.R_OK);
    const indexPath:string = join(frontend, 'index.html');
    const indexStats:Stats = await stat(indexPath);
    if ( ! indexStats.isFile() ) { crash(`Missing frontend index file <${ indexPath }>`); }
    await access(indexPath, constants.R_OK);
  } catch ( error ) {
    const fsError:NodeJS.ErrnoException = error as NodeJS.ErrnoException;
    if ( fsError.code === 'ENOENT' ) { crash(`FRONTEND directory or index file not found in <${ frontend }>`); }
    if ( fsError.code === 'EACCES' || fsError.code === 'EPERM' ) { crash(`FRONTEND path <${ frontend }> is not readable`); }
    crash(`FRONTEND check failed for <${ frontend }>: ${ fsError.code ?? '00' } ${ fsError.message ?? String(error) }`);
  }
}

async function bootstrap():Promise<void> {
  await checkEnvironmentOrCrash();
  await checkFrontendIfNeededOrCrash();
  const app:INestApplication = await NestFactory.create(AppModule, { logger: new AppLogger() });
  const expressApp:NestExpressApplication = app as NestExpressApplication;
  const frontend:string = process.env.FRONTEND ?? '';
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.setGlobalPrefix('/api');
  if ( frontend ) {
    expressApp.useStaticAssets(frontend, { index: false });
    const server = expressApp.getHttpAdapter().getInstance();
    const uiRoutePattern:RegExp = new RegExp(`^(?!/api(?:$|\\/))(?!.*\\.[^\\/]+$).+`);
    server.get(uiRoutePattern, (_request:unknown, response:{ sendFile:(path:string) => void }):void => {
      response.sendFile(join(frontend, 'index.html'));
    });
  }
  app.enableCors();
  SwaggerModule.setup('/api', app,
    SwaggerModule.createDocument(app,
      new DocumentBuilder()
        .setVersion(version)
        .setTitle(title)
        .setDescription(description)
        .addTag('Endpoints', 'Backend available endpoints')
        .addBearerAuth()
        .build(),
    ),
    {
      customSiteTitle: title,
      swaggerOptions: { persistAuthorization: true }
    }
  );
  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Wiki|Docs is listening on ${ await app.getUrl() }`);
}

bootstrap();

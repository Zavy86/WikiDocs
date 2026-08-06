process.env.TZ = 'UTC';
import { INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DASHBOARD_HTML } from 'src/dashboard';
import { AppModule } from 'src/app.module';
import { AppLogger } from 'src/app.logger';

const logger:Logger = new Logger('Bootstrap');

async function bootstrap():Promise<void> {
  const app:INestApplication = await NestFactory.create(AppModule, { logger: new AppLogger() });
  const express:NestExpressApplication = app as NestExpressApplication;
  app.setGlobalPrefix('/api');
  const expressInstance = express.getHttpAdapter().getInstance();
  expressInstance.set('trust proxy', 1);
  expressInstance.get('/', (_request, response):void => {
    response.type('html').send(DASHBOARD_HTML);
  });
  app.enableCors();
  SwaggerModule.setup('/api', app,
    SwaggerModule.createDocument(app,
      new DocumentBuilder()
        .setTitle('Wiki|Docs Pulse')
        .setVersion('1.0.0')
        .setDescription('Metrics & Release service')
        .addTag('Endpoints', 'Available endpoints')
        .addBearerAuth().build(),
    ),
    {
      customSiteTitle: 'Wiki|Docs Pulse'
    }
  );
  await app.listen(process.env.PORT ?? 3001);
  logger.log(`Pulse is listening on ${await app.getUrl()}`);
}

void bootstrap();

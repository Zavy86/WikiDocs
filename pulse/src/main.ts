process.env.TZ = 'UTC';
import { INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from 'src/app.module';
import { AppLogger } from 'src/app.logger';

const logger:Logger = new Logger('Bootstrap');

async function bootstrap():Promise<void> {
  const app:INestApplication = await NestFactory.create(AppModule, { logger: new AppLogger() });
  const expressApp:NestExpressApplication = app as NestExpressApplication;
  app.enableCors();
  SwaggerModule.setup('/', app,
    SwaggerModule.createDocument(app,
      new DocumentBuilder()
        .setTitle('Wiki|Docs Pulse')
        .setVersion('1.0.0')
        .setDescription('Metrics & Release service')
        .addTag('Endpoints', 'Available endpoints')
        .addBearerAuth().build(),
    ),
    {
      customSiteTitle: 'Wiki|Docs Pulse',
      swaggerOptions: { persistAuthorization: true },
    },
  );
  await app.listen(process.env.PORT ?? 3001);
  logger.log(`Pulse is listening on ${await app.getUrl()}`);
}

void bootstrap();

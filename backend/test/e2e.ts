import request from 'supertest';
import { rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { DocumentService } from 'src/services/document.service';

export type E2e = {
  readonly app:INestApplication;
  readonly http:ReturnType<typeof request>;
  readonly datasetsPath:string;
  close:() => Promise<void>;
};

export type E2eMode = 'local' | 'private' | 'public';

const TEST_SECRET:string = 'wikidocs-e2e-test-secret';

export const initializer = {
  title: 'E2E Wiki',
  account: 'john.doe@wikidocs.app',
  firstname: 'John',
  lastname: 'Doe',
  password: 'correct horse battery staple'
};

export async function createE2eApp(mode:E2eMode):Promise<E2e> {
  const datasetsPath:string = await mkdtemp(join(tmpdir(), 'wikidocs-e2e-'));
  const previousEnvironment:Record<string, string | undefined> = {
    MODE: process.env.MODE,
    SECRET: process.env.SECRET,
    DATASETS: process.env.DATASETS,
    FRONTEND: process.env.FRONTEND
  };
  process.env.MODE = mode;
  process.env.SECRET = TEST_SECRET;
  process.env.DATASETS = datasetsPath;
  delete process.env.FRONTEND;
  let app:INestApplication | undefined;
  const restoreEnvironment = ():void => {
    for ( const [ key, value ] of Object.entries(previousEnvironment) ) {
      if ( value === undefined ) {
        delete process.env[ key ];
      } else {
        process.env[ key ] = value;
      }
    }
  };
  const cleanup = async ():Promise<void> => {
    try {
      await app?.close();
    } finally {
      try {
        await rm(datasetsPath, { recursive: true, force: true });
      } finally {
        restoreEnvironment();
      }
    }
  };
  try {
    const moduleRef = await Test.createTestingModule({ imports: [ AppModule ] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    await app.init();
    const documentService = app.get(DocumentService) as unknown as {
      detectAttachmentMimeType:(path:string) => Promise<string>;
    };
    jest.spyOn(documentService, 'detectAttachmentMimeType').mockResolvedValue('application/octet-stream');
    return {
      app,
      http: request(app.getHttpServer()),
      datasetsPath,
      close: cleanup
    };
  } catch ( error ) {
    await cleanup();
    throw error;
  }
}

export async function initialize(testApp:E2e):Promise<void> {
  await testApp.http.post('/api/initialize').send(initializer).expect(204);
}

export async function authenticate(testApp:E2e, account:string = initializer.account, password:string = initializer.password):Promise<string> {
  const response = await testApp.http
    .post('/api/authenticate')
    .send({ account, password })
    .expect(200);
  return response.body.jwt as string;
}

export function bearer(token:string):{ readonly Authorization:string } {
  return { Authorization: `Bearer ${ token }` };
}

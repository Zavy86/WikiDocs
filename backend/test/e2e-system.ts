import { readFile } from 'node:fs/promises';
import { createE2eApp, E2e, initialize, initializer } from './e2e';

describe('local-mode system initialization', (): void => {
  let testApp: E2e;

  beforeEach(async (): Promise<void> => {
    testApp = await createE2eApp('local');
  });

  afterEach(async (): Promise<void> => {
    await testApp.close();
  });

  it('requires no password during initialization', async (): Promise<void> => {
    await testApp.http
      .get('/api/information')
      .expect(200)
      .expect(({ body }): void => {
        expect(body).toMatchObject({ mode: 'local', initialized: false });
      });
    await testApp.http
      .post('/api/initialize')
      .send(initializer)
      .expect(400);
    await testApp.http
      .post('/api/initialize')
      .send({ ...initializer, password: null })
      .expect(204);
  });
});

describe('public-mode system initialization', (): void => {
  let testApp: E2e;

  beforeEach(async (): Promise<void> => {
    testApp = await createE2eApp('public');
  });

  afterEach(async (): Promise<void> => {
    await testApp.close();
  });

  it('reports an uninitialized public system', async (): Promise<void> => {
    await testApp.http
      .get('/api/information')
      .expect(200)
      .expect(({ body }): void => {
        expect(body).toMatchObject({ mode: 'public', initialized: false });
      });
  });
});

describe('private-mode system initialization', ():void => {
  let testApp:E2e;

  beforeEach(async ():Promise<void> => {
    testApp = await createE2eApp('private');
  });

  afterEach(async ():Promise<void> => {
    await testApp.close();
  });

  it('initializes an empty dataset once and creates the default files', async ():Promise<void> => {
    await testApp.http
      .get('/api/information')
      .expect(200)
      .expect(({ body }):void => {
        expect(body).toMatchObject({ mode: 'private', initialized: false });
      });
    await testApp.http
      .head('/api/health')
      .expect(501);
    await testApp.http
      .post('/api/initialize')
      .send({ ...initializer, password: null })
      .expect(400);
    await initialize(testApp);
    await testApp.http
      .head('/api/health')
      .expect(204);
    await testApp.http
      .get('/api/information')
      .expect(200)
      .expect(({ body }): void => {
        expect(body).toMatchObject({ mode: 'private', initialized: true });
      });
    await testApp.http
      .post('/api/initialize')
      .send(initializer)
      .expect(400);
    await expect(readFile(`${ testApp.datasetsPath }/settings.json`, 'utf-8'))
      .resolves.toContain('E2E Wiki');
    await expect(readFile(`${ testApp.datasetsPath }/accounts.json`, 'utf-8'))
      .resolves.toContain(initializer.account);
    await expect(readFile(`${ testApp.datasetsPath }/documents/content.md`, 'utf-8'))
      .resolves.toContain('Wiki|Docs');
  });

});

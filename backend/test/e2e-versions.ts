import { authenticate, bearer, createE2eApp, E2e, initialize } from './e2e';

describe('document versions', ():void => {

  let testApp:E2e;
  let adminToken:string;

  beforeEach(async ():Promise<void> => {
    testApp = await createE2eApp('private');
    await initialize(testApp);
    adminToken = await authenticate(testApp);
  });

  afterEach(async ():Promise<void> => {
    await testApp.close();
  });

  it('creates, retrieves, and removes a document version', async ():Promise<void> => {
    const path:string = '/versioned-document';
    await testApp.http
      .post('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .send({ raw: '# Original' })
      .expect(204);
    await testApp.http
      .post('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .send({ raw: '# Updated', versioning: true })
      .expect(204);
    const document = await testApp.http
      .get('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .expect(200);
    expect(document.body.versions)
      .toHaveLength(1);
    const timestamp:string = document.body.versions[ 0 ] as string;
    await testApp.http
      .get('/api/version')
      .query({ path, timestamp })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
        expect(body.raw).toContain('Original');
      });
    await testApp.http
      .delete('/api/version')
      .query({ path, timestamp })
      .set(bearer(adminToken))
      .expect(204);
    await testApp.http
      .get('/api/version')
      .query({ path, timestamp })
      .set(bearer(adminToken))
      .expect(404);
  });

  it('rejects malformed timestamps and missing version documents', async ():Promise<void> => {
    await testApp.http
      .get('/api/version')
      .query({ path: '/missing', timestamp: 'not-a-timestamp' })
      .set(bearer(adminToken))
      .expect(404);
    await testApp.http
      .delete('/api/version')
      .query({ path: '/missing', timestamp: '1' })
      .set(bearer(adminToken))
      .expect(404);
  });

});

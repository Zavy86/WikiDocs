import { authenticate, bearer, createE2eApp, E2e, initialize } from './e2e';

describe('documents', ():void => {

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

  it('stores, retrieves, and moves a document', async ():Promise<void> => {
    const path:string = '/guides/getting-started';
    await testApp.http
      .post('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .send({ raw: '# Getting started\r\n\r\nWelcome to WikiDocs.' })
      .expect(204);
    const retrieved = await testApp.http
      .get('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .expect(200);
    expect(retrieved.body).toMatchObject({
      exists: true,
      metadata: { path, title: 'Getting started', author: 'John Doe <john.doe@wikidocs.app>' },
      content: { raw: expect.not.stringContaining('\r') }
    });

    await testApp.http
      .patch('/api/document')
      .query({ path, destination: '/archive' })
      .set(bearer(adminToken))
      .expect(204);
    const movedPath:string = '/archive/getting-started';
    await testApp.http
      .get('/api/document')
      .query({ path: movedPath })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => expect(body.exists).toBe(true));
    await testApp.http
      .patch('/api/document')
      .query({ path: '/', destination: '/archive' })
      .set(bearer(adminToken))
      .expect(400);
  });

  it('represents a missing document', async ():Promise<void> => {
    await testApp.http
      .get('/api/document')
      .query({ path: '/missing' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
      expect(body).toMatchObject({ exists: false, content: { raw: '' }, children: [], attachments: [], versions: [] });
    });
  });

  it('rejects invalid document move targets', async ():Promise<void> => {
    await testApp.http
      .post('/api/document')
      .query({ path: '/parent/child' })
      .set(bearer(adminToken))
      .send({ raw: '# Child' })
      .expect(204);
    await testApp.http
      .patch('/api/document')
      .query({ path: '/parent', destination: '/parent' })
      .set(bearer(adminToken))
      .expect(400);
    await testApp.http
      .patch('/api/document')
      .query({ path: '/parent', destination: '/parent/child' })
      .set(bearer(adminToken))
      .expect(400);
  });

  it('rejects unsafe paths and invalid document deletions', async ():Promise<void> => {
    await testApp.http
      .post('/api/document')
      .query({ path: '/guides/../escape' })
      .set(bearer(adminToken))
      .send({ raw: '# Escape' })
      .expect(400);
    await testApp.http
      .post('/api/document')
      .query({ path: '/guides/_versions/history' })
      .set(bearer(adminToken))
      .send({ raw: '# History' })
      .expect(400);
    await testApp.http
      .delete('/api/document')
      .query({ path: '/' })
      .set(bearer(adminToken))
      .expect(400);
    await testApp.http
      .delete('/api/document')
      .query({ path: '/missing' })
      .set(bearer(adminToken))
      .expect(404);
  });

});

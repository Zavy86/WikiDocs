import { authenticate, bearer, createE2eApp, E2e, initialize } from './e2e';

describe('trash', ():void => {

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

  it('restores a deleted document', async ():Promise<void> => {
    const path:string = '/guides/getting-started';
    await testApp.http
      .post('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .send({ raw: '# Getting started' })
      .expect(204);
    await testApp.http
      .delete('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .expect(204);
    const trash = await testApp.http
      .get('/api/trash')
      .set(bearer(adminToken))
      .expect(200);
    const trashPath:string = trash.body.documents
      .find((document:{ path:string }):boolean => document.path.endsWith('getting-started')).path as string;
    await testApp.http
      .patch('/api/trash')
      .query({ path: trashPath, destination: '/restored' })
      .set(bearer(adminToken))
      .expect(204);
    await testApp.http
      .get('/api/document')
      .query({ path: '/restored/getting-started' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => expect(body.exists)
        .toBe(true));
  });

  it('permanently removes a deleted document from trash', async ():Promise<void> => {
    const path:string = '/permanent';
    await testApp.http
      .post('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .send({ raw: '# Permanent' })
      .expect(204);
    await testApp.http
      .delete('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .expect(204);
    const trash = await testApp.http
      .get('/api/trash')
      .set(bearer(adminToken))
      .expect(200);
    const trashPath:string = trash.body.documents
      .find((document:{ path:string }):boolean => document.path.endsWith('permanent')).path as string;
    await testApp.http
      .delete('/api/trash')
      .query({ path: trashPath })
      .set(bearer(adminToken))
      .expect(204);
    await testApp.http
      .delete('/api/trash')
      .query({ path: trashPath })
      .set(bearer(adminToken))
      .expect(404);
  });

});

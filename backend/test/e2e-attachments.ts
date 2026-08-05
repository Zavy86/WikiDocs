import { authenticate, bearer, createE2eApp, E2e, initialize } from './e2e';

describe('attachments', ():void => {

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

  it('serves signed attachments publicly and rejects altered tokens', async ():Promise<void> => {
    const path:string = '/attachment-document';
    await testApp.http
      .post('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .send({ raw: '# Attachment document' })
      .expect(204);
    await testApp.http
      .post('/api/attachment')
      .query({ path, file: 'note.txt' })
      .set(bearer(adminToken))
      .attach('file', Buffer.from('attachment content'), 'note.txt')
      .expect(204);
    const document = await testApp.http
      .get('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .expect(200);
    const attachment = document.body.attachments[ 0 ] as { file:string; token:string };
    const downloaded = await testApp.http
      .get('/api/attachment')
      .query({ path, file: attachment.file, token: attachment.token })
      .expect(200)
      .expect('Content-Type', /application\/octet-stream/);
    expect(downloaded.body).toEqual(Buffer.from('attachment content'));
    await testApp.http
      .get('/api/attachment')
      .query({ path, file: 'other.txt', token: attachment.token })
      .expect(401);
    await testApp.http
      .delete('/api/attachment')
      .query({ path, file: attachment.file })
      .set(bearer(adminToken))
      .expect(204);
    await testApp.http
      .get('/api/attachment')
      .query({ path, file: attachment.file, token: attachment.token })
      .expect(404);
  });

  it('rejects invalid attachment uploads and removals', async ():Promise<void> => {
    await testApp.http
      .post('/api/attachment')
      .query({ path: '/missing', file: 'note.txt' })
      .set(bearer(adminToken))
      .attach('file', Buffer.from('attachment content'), 'note.txt')
      .expect(404);
    await testApp.http
      .post('/api/document')
      .query({ path: '/attachment-document' })
      .set(bearer(adminToken))
      .send({ raw: '# Attachment document' })
      .expect(204);
    await testApp.http
      .post('/api/attachment')
      .query({ path: '/attachment-document', file: 'note.txt' })
      .set(bearer(adminToken))
      .expect(400);
    await testApp.http
      .delete('/api/attachment')
      .query({ path: '/attachment-document', file: 'missing.txt' })
      .set(bearer(adminToken))
      .expect(404);
  });

});

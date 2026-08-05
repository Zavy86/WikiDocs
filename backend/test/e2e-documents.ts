import { authenticate, bearer, createE2eApp, E2e, initialize } from './e2e';

describe('documents, attachments, pinned documents, search, and trash (e2e)', ():void => {
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

  it('stores, retrieves, versions, moves, searches, pins, and restores a document', async ():Promise<void> => {
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
      .post('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .send({ raw: '# Updated\n\nA searchable word.', versioning: true })
      .expect(204);
    const versioned = await testApp.http
      .get('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .expect(200);
    expect(versioned.body.versions).toHaveLength(1);
    const timestamp:string = versioned.body.versions[ 0 ] as string;
    await testApp.http
      .get('/api/version')
      .query({ path, timestamp })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
      expect(body.raw).toContain('Getting started');
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

    await testApp.http
      .get('/api/search')
      .query({ query: 'searchable' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
      expect(body.results[ 0 ].highlights[ 0 ]).toContain('==searchable==');
    });
    await testApp.http
      .get('/api/search')
      .query({ query: ' ' })
      .set(bearer(adminToken))
      .expect(400);
    await testApp.http
      .post('/api/pinned')
      .query({ path })
      .set(bearer(adminToken))
      .expect(204);
    await testApp.http
      .get('/api/pinned')
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
      expect(body.documents).toEqual(expect.arrayContaining([ expect.objectContaining({ path }) ]));
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

    await testApp.http
      .delete('/api/document')
      .query({ path: movedPath })
      .set(bearer(adminToken))
      .expect(204);
    const trash = await testApp.http
      .get('/api/trash')
      .set(bearer(adminToken))
      .expect(200);
    const trashPath:string = trash.body.documents.find((document:{ path:string }):boolean => document.path.endsWith('getting-started')).path as string;
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
      .expect(({ body }):void => expect(body.exists).toBe(true));
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

  it('represents a missing document and rejects a missing tree path', async ():Promise<void> => {
    await testApp.http
      .get('/api/document')
      .query({ path: '/missing' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
      expect(body).toMatchObject({ exists: false, content: { raw: '' }, children: [], attachments: [], versions: [] });
    });
    await testApp.http
      .get('/api/tree')
      .query({ path: '/missing' })
      .set(bearer(adminToken))
      .expect(404);
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

  it('sorts and unpins documents while rejecting duplicate and absent pins', async ():Promise<void> => {
    await testApp.http
      .post('/api/document')
      .query({ path: '/first' })
      .set(bearer(adminToken))
      .send({ raw: '# First' })
      .expect(204);
    await testApp.http
      .post('/api/document')
      .query({ path: '/second' })
      .set(bearer(adminToken))
      .send({ raw: '# Second' })
      .expect(204);
    await testApp.http
      .post('/api/pinned')
      .query({ path: '/first' })
      .set(bearer(adminToken))
      .expect(204);
    await testApp.http
      .post('/api/pinned')
      .query({ path: '/second' })
      .set(bearer(adminToken))
      .expect(204);
    await testApp.http
      .post('/api/pinned')
      .query({ path: '/first' })
      .set(bearer(adminToken))
      .expect(400);
    await testApp.http
      .patch('/api/pinned')
      .query({ path: '/second', sorting: 1 })
      .set(bearer(adminToken))
      .expect(204);
    await testApp.http
      .get('/api/pinned')
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
      expect(body.documents.map((document:{ path:string }):string => document.path)).toEqual([ '/second', '/first' ]);
    });
    await testApp.http
      .patch('/api/pinned')
      .query({ path: '/second', sorting: 3 })
      .set(bearer(adminToken))
      .expect(400);
    await testApp.http
      .delete('/api/pinned')
      .query({ path: '/second' })
      .set(bearer(adminToken))
      .expect(204);
    await testApp.http
      .delete('/api/pinned')
      .query({ path: '/second' })
      .set(bearer(adminToken))
      .expect(404);
  });

  it('permanently removes a deleted document from trash', async ():Promise<void> => {
    await testApp.http
      .post('/api/document')
      .query({ path: '/permanent' })
      .set(bearer(adminToken))
      .send({ raw: '# Permanent' })
      .expect(204);
    await testApp.http
      .delete('/api/document')
      .query({ path: '/permanent' })
      .set(bearer(adminToken))
      .expect(204);
    const trash = await testApp.http
      .get('/api/trash')
      .set(bearer(adminToken))
      .expect(200);
    const trashPath:string = trash.body.documents.find((document:{ path:string }):boolean => document.path.endsWith('permanent')).path as string;
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

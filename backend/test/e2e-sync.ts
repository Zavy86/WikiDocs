import * as unzipper from 'unzipper';
import type { Response } from 'superagent';
import { authenticate, bearer, createE2eApp, E2e, initialize } from './e2e';

function readBinaryResponse(response:Response, callback:(error:Error | null, body:Buffer) => void):void {
  const chunks:Buffer[] = [];
  response.on('data', (chunk:Buffer):void => { chunks.push(Buffer.from(chunk)); });
  response.on('error', (error:Error):void => callback(error, Buffer.alloc(0)));
  response.on('end', ():void => callback(null, Buffer.concat(chunks)));
}

describe('synchronization (e2e)', ():void => {
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

  it('rejects invalid sync requests and archives', async (): Promise<void> => {
    await testApp.http
      .post('/api/sync')
      .set(bearer(adminToken))
      .send({ retrieve: ['/same'], delete: ['/same'] })
      .expect(400);
    await testApp.http
      .post('/api/sync')
      .set(bearer(adminToken))
      .send({ retrieve: ['/missing'], delete: [] })
      .expect(404);
    await testApp.http
      .put('/api/sync')
      .set(bearer(adminToken))
      .attach('file', Buffer.from('not a zip archive'), 'invalid.zip')
      .expect(400);
  });

  it('creates a snapshot, exports a document archive, deletes it, and imports it back', async ():Promise<void> => {
    const path:string = '/sync/document';
    await testApp.http
      .post('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .send({ raw: '# Sync document\n\nContent sent through sync.' })
      .expect(204);
    await testApp.http
      .post('/api/attachment')
      .query({ path, file: 'attachment.txt' })
      .set(bearer(adminToken))
      .attach('file', Buffer.from('sync attachment'), 'attachment.txt')
      .expect(204);
    await testApp.http
      .get('/api/sync')
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
      expect(body.documents)
        .toEqual(expect.arrayContaining([ expect.objectContaining({ path }) ]));
      expect(body.documents.map((document:{ path:string }):string => document.path))
        .toEqual([ ...body.documents.map((document:{ path:string }):string => document.path) ].sort());
    });
    const exported = await testApp.http
      .post('/api/sync')
      .set(bearer(adminToken))
      .send({ retrieve: [ path ], delete: [] })
      .buffer(true)
      .parse(readBinaryResponse)
      .expect(200)
      .expect('Content-Type', /application\/zip/);
    const archive:Buffer = exported.body as Buffer;
    const files:unzipper.CentralDirectory = await unzipper.Open.buffer(archive);
    expect(files.files.map((file:unzipper.File):string => file.path))
      .toEqual(expect.arrayContaining([ 'sync/document/content.md', 'sync/document/attachment.txt' ]));
    await testApp.http
      .post('/api/sync')
      .set(bearer(adminToken))
      .send({ retrieve: [], delete: [ path ] })
      .expect(200);
    await testApp.http
      .get('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => expect(body.exists).toBe(false));
    await testApp.http
      .put('/api/sync')
      .set(bearer(adminToken))
      .attach('file', archive, 'sync.zip')
      .expect(204);
    await testApp.http
      .get('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
      expect(body)
        .toMatchObject({ exists: true, content: { raw: expect.stringContaining('Content sent through sync.') } });
      expect(body.attachments)
        .toEqual(expect.arrayContaining([ expect.objectContaining({ file: 'attachment.txt' }) ]));
    });
  });

});

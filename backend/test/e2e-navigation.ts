import { authenticate, bearer, createE2eApp, E2e, initialize } from './e2e';

describe('navigation', ():void => {

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

  it('rejects a missing tree path', async (): Promise<void> => {
    await testApp.http
      .get('/api/tree')
      .query({ path: '/missing' })
      .set(bearer(adminToken))
      .expect(404);
  });

  it('retrieves the immediate children of a tree path', async ():Promise<void> => {
    await testApp.http
      .post('/api/document')
      .query({ path: '/guides/getting-started' })
      .set(bearer(adminToken))
      .send({ raw: '# Getting started' })
      .expect(204);
    await testApp.http
      .post('/api/document')
      .query({ path: '/guides/advanced' })
      .set(bearer(adminToken))
      .send({ raw: '# Advanced' })
      .expect(204);
    await testApp.http
      .get('/api/tree')
      .query({ path: '/guides' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
        expect(body.leaves.map((document:{ path:string }):string => document.path))
          .toEqual(expect.arrayContaining([ '/guides/getting-started', '/guides/advanced' ]));
      });
  });

  it('searches document content and rejects an empty query', async ():Promise<void> => {
    const path:string = '/guides/getting-started';
    await testApp.http
      .post('/api/document')
      .query({ path })
      .set(bearer(adminToken))
      .send({ raw: '# Getting started\n\nA searchable word.' })
      .expect(204);
    await testApp.http
      .get('/api/search')
      .query({ query: 'searchable' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
        expect(body.results[ 0 ].highlights[ 0 ])
          .toContain('==searchable==');
      });
    await testApp.http
      .get('/api/search')
      .query({ query: ' ' })
      .set(bearer(adminToken))
      .expect(400);
  });

  it('returns no results for an unmatched query and validates pinned documents', async ():Promise<void> => {
    await testApp.http
      .get('/api/search')
      .query({ query: 'unmatched-query' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
        expect(body.results).toEqual([]);
      });
    await testApp.http
      .post('/api/pinned')
      .query({ path: '/missing' })
      .set(bearer(adminToken))
      .expect(400);
    await testApp.http
      .post('/api/document')
      .query({ path: '/pinned-document' })
      .set(bearer(adminToken))
      .send({ raw: '# Pinned document' })
      .expect(204);
    await testApp.http
      .post('/api/pinned')
      .query({ path: '/pinned-document' })
      .set(bearer(adminToken))
      .expect(204);
    await testApp.http
      .patch('/api/pinned')
      .query({ path: '/pinned-document', sorting: 'first' })
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
        expect(body.documents.map((document:{ path:string }):string => document.path))
          .toEqual([ '/second', '/first' ]);
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

});

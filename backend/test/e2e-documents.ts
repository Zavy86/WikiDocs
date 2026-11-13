import { authenticate, bearer, createE2eApp, E2e, initialize } from './e2e';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

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

  it('represents a directory with child documents and no content as a hierarchy page', async ():Promise<void> => {
    const documentsPath:string = join(testApp.datasetsPath, 'documents');
    await mkdir(join(documentsPath, 'guides', 'hierarchy', 'child'), { recursive: true });
    await writeFile(join(documentsPath, 'guides', 'hierarchy', 'child', 'content.md'), '# Child', 'utf-8');
    await testApp.http
      .get('/api/document')
      .query({ path: '/guides/hierarchy' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
        expect(body).toMatchObject({
          exists: false,
          metadata: { path: '/guides/hierarchy', title: 'hierarchy' },
          content: { raw: '' },
          attachments: [],
          versions: []
        });
        expect(body.children).toEqual(expect.arrayContaining([
          expect.objectContaining({ path: '/guides/hierarchy/child', title: 'child' })
        ]));
      });
  });

  it('uses fallback titles for documents without a title', async ():Promise<void> => {
    const documentsPath:string = join(testApp.datasetsPath, 'documents');
    await mkdir(join(documentsPath, 'guides', 'without-content'), { recursive: true });
    await mkdir(join(documentsPath, 'guides', 'blank-title'), { recursive: true });
    await writeFile(
      join(documentsPath, 'guides', 'blank-title', 'content.md'),
      '---\ntitle: "   "\n---\nDocument body.\n',
      'utf-8'
    );
    await writeFile(join(documentsPath, 'content.md'), 'Document body.\n', 'utf-8');
    await testApp.http
      .get('/api/document')
      .query({ path: '/guides/without-content' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => expect(body.metadata.title).toBe('without-content'));
    await testApp.http
      .get('/api/document')
      .query({ path: '/guides/blank-title' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => expect(body.metadata.title).toBe('blank-title'));
    await testApp.http
      .get('/api/document')
      .query({ path: '/' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => expect(body.metadata.title).toBe('E2E Wiki'));
    await testApp.http
      .get('/api/tree')
      .query({ path: '/guides' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
        expect(body.leaves).toEqual(expect.arrayContaining([
          expect.objectContaining({ path: '/guides/without-content', title: 'without-content' }),
          expect.objectContaining({ path: '/guides/blank-title', title: 'blank-title' })
        ]));
      });
  });

  it('keeps non-English letters and numbers in document paths', async ():Promise<void> => {
    const documentsPath:string = join(testApp.datasetsPath, 'documents');
    await testApp.http
      .post('/api/document')
      .query({ path: '/Guides/Été 2026' })
      .set(bearer(adminToken))
      .send({ raw: '# Été' })
      .expect(204);
    await expect(readFile(join(documentsPath, 'guides', 'Été-2026', 'content.md'), 'utf-8')).resolves.toContain('# Été');
    await testApp.http
      .post('/api/document')
      .query({ path: '/文档/指南' })
      .set(bearer(adminToken))
      .send({ raw: '# 指南' })
      .expect(204);
    await testApp.http
      .get('/api/document')
      .query({ path: '/文档/指南' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => expect(body).toMatchObject({ exists: true, metadata: { path: '/文档/指南', title: '指南' } }));
    await testApp.http
      .get('/api/tree')
      .query({ path: '/文档' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => {
        expect(body.leaves).toEqual([ expect.objectContaining({ path: '/文档/指南', title: '指南' }) ]);
      });
  });

  it('resolves existing directories with non-English names', async ():Promise<void> => {
    const documentsPath:string = join(testApp.datasetsPath, 'documents');
    await mkdir(join(documentsPath, 'École', 'résumé'), { recursive: true });
    await writeFile(join(documentsPath, 'École', 'résumé', 'content.md'), 'Document body.\n', 'utf-8');
    await testApp.http
      .get('/api/document')
      .query({ path: '/École/résumé' })
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }):void => expect(body).toMatchObject({ exists: true, metadata: { path: '/École/résumé', title: 'résumé' } }));
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

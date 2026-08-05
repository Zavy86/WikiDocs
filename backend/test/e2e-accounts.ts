import { authenticate, bearer, createE2eApp, E2e, initialize, initializer } from './e2e';

describe('accounts (local mode)', ():void => {

  let testApp:E2e;

  beforeEach(async ():Promise<void> => {
    testApp = await createE2eApp('local');
    await testApp.http
      .post('/api/initialize')
      .send({ ...initializer, password: null })
      .expect(204);
  });

  afterEach(async ():Promise<void> => {
    await testApp.close();
  });

  it('issues an administrator local token', async ():Promise<void> => {
    const response = await testApp.http
      .get('/api/local')
      .expect(200);
    const token:string = response.body.jwt as string;
    await testApp.http
      .head('/api/token')
      .set(bearer(token))
      .expect(204);
    await testApp.http
      .post('/api/document')
      .query({ path: '/local-document' })
      .set(bearer(token))
      .send({ raw: '# Written locally' })
      .expect(204);
  });

  it('disables guest access, account authentication, and account management', async ():Promise<void> => {
    const response = await testApp.http
      .get('/api/local')
      .expect(200);
    const token:string = response.body.jwt as string;
    await testApp.http
      .get('/api/guest')
      .expect(401);
    await testApp.http
      .post('/api/authenticate')
      .send({ account: initializer.account, password: initializer.password })
      .expect(400);
    await testApp.http
      .get('/api/accounts')
      .set(bearer(token))
      .expect(400);
  });
});

describe('accounts (public mode)', (): void => {

  let testApp: E2e;

  beforeEach(async (): Promise<void> => {
    testApp = await createE2eApp('public');
    await initialize(testApp);
  });

  afterEach(async (): Promise<void> => {
    await testApp.close();
  });

  it('issues a read-only guest token and disables local access', async (): Promise<void> => {
    const response = await testApp.http
      .get('/api/guest')
      .expect(200);
    const token: string = response.body.jwt as string;
    await testApp.http
      .head('/api/token')
      .set(bearer(token))
      .expect(204);
    await testApp.http
      .get('/api/tree')
      .query({ path: '/' })
      .set(bearer(token))
      .expect(200);
    await testApp.http
      .post('/api/document')
      .query({ path: '/guest-document' })
      .set(bearer(token))
      .send({ raw: '# Forbidden guest write' })
      .expect(401);
    await testApp.http
      .get('/api/local')
      .expect(401);
  });

});

describe('accounts (private mode)', (): void => {

  let testApp: E2e;

  beforeEach(async (): Promise<void> => {
    testApp = await createE2eApp('private');
    await initialize(testApp);
  });

  afterEach(async (): Promise<void> => {
    await testApp.close();
  });

  it('authenticates administrators and rejects mode-specific session tokens', async (): Promise<void> => {
    await testApp.http
      .get('/api/guest')
      .expect(401);
    await testApp.http
      .get('/api/local')
      .expect(401);
    await testApp.http
      .post('/api/authenticate')
      .send({ account: initializer.account, password: 'wrong password' })
      .expect(401);
    await testApp.http
      .post('/api/authenticate')
      .send({ account: initializer.account, password: initializer.password, duration: 1 })
      .expect(400);
    await testApp.http
      .get('/api/tree')
      .query({ path: '/' })
      .expect(401);
    const token: string = await authenticate(testApp);
    await testApp.http
      .head('/api/token')
      .set(bearer(token))
      .expect(204);
    await testApp.http
      .head('/api/token')
      .set('Authorization', 'Bearer altered.token')
      .expect(401);
    await testApp.http
      .get('/api/tree')
      .query({ path: '/' })
      .set(bearer(token))
      .expect(200);
  });

  it('manages accounts, protects administration, and applies profile password changes', async (): Promise<void> => {
    const author = {
      account: 'author@example.test',
      firstname: 'Author',
      lastname: 'User',
      role: 'author',
      password: 'author password',
    };
    const reader = {
      account: 'reader@example.test',
      firstname: 'Reader',
      lastname: 'User',
      role: 'user',
      password: 'reader password',
    };
    const adminToken: string = await authenticate(testApp);
    const settings = await testApp.http
      .get('/api/settings')
      .expect(200);
    await testApp.http
      .post('/api/accounts')
      .set(bearer(adminToken))
      .send({ accounts: [author, reader] })
      .expect(204);
    await testApp.http
      .get('/api/accounts')
      .set(bearer(adminToken))
      .expect(200)
      .expect(({ body }): void => {
        const returnedAccounts: Array<{ account: string; password?: string }> = body.accounts;
        expect(returnedAccounts)
          .toEqual(expect.arrayContaining([
            expect.objectContaining({ account: author.account }),
            expect.objectContaining({ account: reader.account })
          ]));
        expect(returnedAccounts.every((account: { password?: string }): boolean => account.password === undefined))
          .toBe(true);
      });
    await testApp.http
      .post('/api/accounts')
      .set(bearer(adminToken))
      .send({ accounts: [{ ...author, account: 'missing-password@example.test', password: null }] })
      .expect(400);
    const readerToken: string = await authenticate(testApp, reader.account, reader.password);
    await testApp.http
      .put('/api/settings')
      .set(bearer(readerToken))
      .send({})
      .expect(401);
    await testApp.http
      .post('/api/document')
      .query({ path: '/forbidden' })
      .set(bearer(readerToken))
      .send({ raw: '# Forbidden' })
      .expect(401);
    await testApp.http
      .put('/api/settings')
      .set(bearer(readerToken))
      .send({ ...settings.body, color: '#112233' })
      .expect(401);
    await testApp.http
      .post('/api/sync')
      .set(bearer(readerToken))
      .send({ retrieve: [], delete: [] })
      .expect(401);
    const authorToken: string = await authenticate(testApp, author.account, author.password);
    await testApp.http
      .post('/api/document')
      .query({ path: '/author-document' })
      .set(bearer(authorToken))
      .send({ raw: '# Written by an author' })
      .expect(204);
    await testApp.http
      .delete('/api/document')
      .query({ path: '/author-document' })
      .set(bearer(readerToken))
      .expect(401);
    await testApp.http
      .delete('/api/document')
      .query({ path: '/author-document' })
      .set(bearer(authorToken))
      .expect(204);
    await testApp.http
      .put('/api/settings')
      .set(bearer(authorToken))
      .send({ ...settings.body, color: '#112233' })
      .expect(401);
    await testApp.http
      .post('/api/sync')
      .set(bearer(authorToken))
      .send({ retrieve: [], delete: [] })
      .expect(401);
    await testApp.http
      .put('/api/settings')
      .set(bearer(adminToken))
      .send({ ...settings.body, color: '#112233' })
      .expect(204);
    await testApp.http
      .get('/api/settings')
      .expect(200)
      .expect(({ body }): void => expect(body.color).toBe('#112233'));
    await testApp.http
      .patch('/api/profile')
      .set(bearer(readerToken))
      .send({ firstname: 'Renamed', lastname: 'Reader', password: 'new reader password' })
      .expect(204);
    await testApp.http
      .post('/api/authenticate')
      .send({ account: reader.account, password: reader.password })
      .expect(401);
    await authenticate(testApp, reader.account, 'new reader password');
    await testApp.http
      .delete('/api/accounts')
      .query({ account: 'unknown@example.test' })
      .set(bearer(adminToken))
      .expect(404);
    await testApp.http
      .delete('/api/accounts')
      .query({ account: reader.account })
      .set(bearer(adminToken))
      .expect(204);
    await testApp.http
      .head('/api/token')
      .set(bearer(readerToken))
      .expect(401);
  });

});

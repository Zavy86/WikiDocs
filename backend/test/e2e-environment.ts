import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveSecretFromFile } from 'src/app.environment';

describe('secret file resolution', (): void => {
  let directory:string;

  beforeEach(async (): Promise<void> => {
    directory = await mkdtemp(join(tmpdir(), 'wikidocs-secret-'));
  });

  afterEach(async (): Promise<void> => {
    await rm(directory, { recursive: true, force: true });
  });

  it('leaves SECRET untouched when SECRET_FILE is not set', async (): Promise<void> => {
    const environment:NodeJS.ProcessEnv = { SECRET: 'from-variable' };
    await resolveSecretFromFile(environment);
    expect(environment.SECRET).toBe('from-variable');
  });

  it('ignores an empty SECRET_FILE', async (): Promise<void> => {
    const environment:NodeJS.ProcessEnv = { SECRET: 'from-variable', SECRET_FILE: '' };
    await resolveSecretFromFile(environment);
    expect(environment.SECRET).toBe('from-variable');
  });

  it('reads SECRET from SECRET_FILE and strips trailing line breaks', async (): Promise<void> => {
    const file:string = join(directory, 'secret');
    await writeFile(file, 'from-file\r\n\n');
    const environment:NodeJS.ProcessEnv = { SECRET_FILE: file };
    await resolveSecretFromFile(environment);
    expect(environment.SECRET).toBe('from-file');
  });

  it('keeps inner whitespace of the secret', async (): Promise<void> => {
    const file:string = join(directory, 'secret');
    await writeFile(file, ' with spaces\tinside \n');
    const environment:NodeJS.ProcessEnv = { SECRET_FILE: file };
    await resolveSecretFromFile(environment);
    expect(environment.SECRET).toBe(' with spaces\tinside ');
  });

  it('gives SECRET_FILE precedence over SECRET', async (): Promise<void> => {
    const file:string = join(directory, 'secret');
    await writeFile(file, 'from-file');
    const environment:NodeJS.ProcessEnv = { SECRET: 'wikidocs-insecure-secret-to-be-changed', SECRET_FILE: file };
    await resolveSecretFromFile(environment);
    expect(environment.SECRET).toBe('from-file');
  });

  it('fails when SECRET_FILE does not exist', async (): Promise<void> => {
    const file:string = join(directory, 'missing');
    await expect(resolveSecretFromFile({ SECRET_FILE: file })).rejects.toThrow(`SECRET_FILE <${ file }> cannot be read: ENOENT`);
  });

  it('fails when SECRET_FILE is empty', async (): Promise<void> => {
    const file:string = join(directory, 'secret');
    await writeFile(file, '\n');
    const environment:NodeJS.ProcessEnv = { SECRET: 'from-variable', SECRET_FILE: file };
    await expect(resolveSecretFromFile(environment)).rejects.toThrow(`SECRET_FILE <${ file }> is empty`);
    expect(environment.SECRET).toBe('from-variable');
  });
});

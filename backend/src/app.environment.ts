import { readFile } from "node:fs/promises";

/**
 * Resolves the SECRET environment variable from the file referenced by SECRET_FILE (Docker/Kubernetes secrets convention).
 * When SECRET_FILE is set it takes precedence over SECRET, because the container image ships with a default SECRET value.
 * Trailing line breaks are removed, as secret files usually end with one.
 * Throws an error with a meaningful message if the file cannot be read or is empty.
 */
export async function resolveSecretFromFile(environment:NodeJS.ProcessEnv = process.env):Promise<void> {
  const secretFile:string = environment.SECRET_FILE ?? '';
  if ( ! secretFile ) { return; }
  let content:string;
  try {
    content = await readFile(secretFile, 'utf8');
  } catch ( error ) {
    throw new Error(`SECRET_FILE <${ secretFile }> cannot be read: ${ (error as Error).message }`);
  }
  const secret:string = content.replace(/[\r\n]+$/, '');
  if ( ! secret.trim() ) { throw new Error(`SECRET_FILE <${ secretFile }> is empty`); }
  environment.SECRET = secret;
}

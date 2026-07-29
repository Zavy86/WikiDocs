import type { ActionsContract, AuthenticateContract, JwtContract, SnapshotContract } from '../../shared/contracts';

export class SyncApiClient {

  private readonly baseUrl:string;

  constructor(baseUrl:string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private buildUrl(path:string):string {
    const cleanPath:string = path.startsWith('/') ? path : `/${ path }`;
    return `${ this.baseUrl }/api${ cleanPath }`;
  }

  private async parseErrorMessage(response:Response):Promise<string> {
    try {
      const text:string = await response.text();
      const parsed:unknown = JSON.parse(text);
      if ( typeof parsed === 'object' && parsed !== null ) {
        const candidate:Record<string, unknown> = parsed as Record<string, unknown>;
        if ( Array.isArray(candidate.message) ) {
          return candidate.message.join(', ');
        }
        if ( typeof candidate.message === 'string' ) {
          return candidate.message;
        }
      }
      return text || response.statusText;
    } catch {
      return response.statusText;
    }
  }

  public async getLocalToken():Promise<string> {
    const response:Response = await fetch(this.buildUrl('/local'), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if ( ! response.ok ) {
      const details:string = await this.parseErrorMessage(response);
      throw new Error(`Failed to retrieve local token: HTTP ${ response.status } - ${ details }`);
    }
    const data:JwtContract = await response.json() as JwtContract;
    return data.jwt;
  }

  public async authenticateRemote(credentials:AuthenticateContract):Promise<string> {
    const payload:Record<string, unknown> = {
      account: credentials.account,
      password: credentials.password,
    };
    if ( typeof credentials.duration === 'number' && credentials.duration >= 900 ) {
      payload.duration = credentials.duration;
    }

    const response:Response = await fetch(this.buildUrl('/authenticate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if ( ! response.ok ) {
      const details:string = await this.parseErrorMessage(response);
      throw new Error(`Authentication failed for server <${ this.baseUrl }>: HTTP ${ response.status } - ${ details }`);
    }

    const data:JwtContract = await response.json() as JwtContract;
    return data.jwt;
  }

  public async getSnapshot(token:string):Promise<SnapshotContract> {
    const response:Response = await fetch(this.buildUrl('/sync'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ token }`,
        'Accept': 'application/json',
      },
    });
    if ( ! response.ok ) {
      const details:string = await this.parseErrorMessage(response);
      throw new Error(`Failed to retrieve snapshot from <${ this.baseUrl }>: HTTP ${ response.status } - ${ details }`);
    }
    return await response.json() as SnapshotContract;
  }

  public async postActions(token:string, actions:ActionsContract):Promise<Buffer> {
    const response:Response = await fetch(this.buildUrl('/sync'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ token }`,
        'Content-Type': 'application/json',
        'Accept': 'application/zip, application/octet-stream',
      },
      body: JSON.stringify(actions),
    });
    if ( ! response.ok ) {
      const details:string = await this.parseErrorMessage(response);
      throw new Error(`Failed to execute actions on <${ this.baseUrl }>: HTTP ${ response.status } - ${ details }`);
    }
    const arrayBuffer:ArrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  public async putImport(token:string, zipBuffer:Buffer):Promise<void> {
    const formData:FormData = new FormData();
    const blob:Blob = new Blob([new Uint8Array(zipBuffer)], { type: 'application/zip' });
    formData.append('file', blob, 'sync.zip');

    const response:Response = await fetch(this.buildUrl('/sync'), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${ token }`,
      },
      body: formData,
    });
    if ( ! response.ok ) {
      const details:string = await this.parseErrorMessage(response);
      throw new Error(`Failed to import sync archive to <${ this.baseUrl }>: HTTP ${ response.status } - ${ details }`);
    }
  }

}

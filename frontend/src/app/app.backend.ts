export const DEBUG:boolean = resolveDebug();
export const BACKEND_BASE_URL:string = resolveBackendBaseUrl();

function checkIfDevelopmentMode():boolean {
  return typeof window !== 'undefined'
    && [ 'localhost', '127.0.0.1' ].includes(window.location.hostname)
    && window.location.port === '4200';
}

function resolveDebug():boolean {
  return checkIfDevelopmentMode();
}

function resolveBackendBaseUrl():string {
  if ( checkIfDevelopmentMode() ) { return 'http://localhost:3000/api'; } else { return '/api'; }
}

export function buildBackendUrl(path:string):string {
  if ( /^https?:\/\//.test(path) ) { return path; }
  const normalizedPath:string = path.startsWith('/') ? path : `/${ path }`;
  return `${ BACKEND_BASE_URL }${ normalizedPath }`;
}

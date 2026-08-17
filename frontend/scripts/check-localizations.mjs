import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const localizationsDirectory = path.resolve(scriptDirectory, '../src/app/localizations');
const keySegmentPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const languagePattern = /^[a-z]{2}(?:-[a-z0-9]+)*$/;
const placeholderPattern = /\{([a-z0-9]+(?:-[a-z0-9]+)*)(?::([^{}]*))?}/g;

function isObject(value) {
  return typeof value === 'object' && value !== null && ! Array.isArray(value);
}

function validatePlaceholders(value, language, code) {
  const placeholders = new Set();
  const unmatched = value.replace(placeholderPattern, (_match, name) => {
    placeholders.add(name);
    return '';
  });
  if ( unmatched.includes('{') || unmatched.includes('}') ) {
    throw new Error(`${ language }: localization \`${ code }\` contains an invalid placeholder`);
  }
  return placeholders;
}

function flattenLocalization(tree, language, prefix = '', flattened = new Map()) {
  if ( ! isObject(tree) ) {
    throw new Error(`${ language }: the catalog root must be a YAML object`);
  }
  const entries = Object.entries(tree);
  if ( entries.length === 0 ) {
    throw new Error(`${ language }: localization namespace \`${ prefix || '<root>' }\` cannot be empty`);
  }
  for ( const [ key, value ] of entries ) {
    if ( ! keySegmentPattern.test(key) ) {
      throw new Error(`${ language }: invalid localization key segment \`${ key }\``);
    }
    const code = prefix ? `${ prefix }.${ key }` : key;
    if ( typeof value === 'string' ) {
      if ( value.length === 0 ) { throw new Error(`${ language }: localization \`${ code }\` cannot be empty`); }
      flattened.set(code, validatePlaceholders(value, language, code));
      continue;
    }
    if ( ! isObject(value) ) {
      throw new Error(`${ language }: localization \`${ code }\` must contain an object or string`);
    }
    flattenLocalization(value, language, code, flattened);
  }
  return flattened;
}

function compareCatalog(reference, candidate, language) {
  const missing = [ ...reference.keys() ].filter((code) => ! candidate.has(code));
  const extra = [ ...candidate.keys() ].filter((code) => ! reference.has(code));
  if ( missing.length > 0 || extra.length > 0 ) {
    const details = [
      ...( missing.length > 0 ? [ `missing: ${ missing.join(', ') }` ] : [] ),
      ...( extra.length > 0 ? [ `extra: ${ extra.join(', ') }` ] : [] ),
    ];
    throw new Error(`${ language }: catalog keys differ from en (${ details.join('; ') })`);
  }
  for ( const [ code, referencePlaceholders ] of reference ) {
    const candidatePlaceholders = candidate.get(code);
    const missing = [ ...referencePlaceholders ].filter((name) => ! candidatePlaceholders.has(name));
    const extra = [ ...candidatePlaceholders ].filter((name) => ! referencePlaceholders.has(name));
    if ( missing.length > 0 || extra.length > 0 ) {
      throw new Error(`${ language }: placeholders for \`${ code }\` differ from en`);
    }
  }
}

const files = ( await readdir(localizationsDirectory, { withFileTypes: true }) )
  .filter((entry) => entry.isFile() && entry.name.endsWith('.yml'))
  .map((entry) => entry.name)
  .sort();

if ( ! files.includes('en.yml') ) { throw new Error('The reference catalog en.yml is missing'); }

const catalogs = new Map();
for ( const file of files ) {
  const language = path.basename(file, '.yml');
  if ( ! languagePattern.test(language) ) { throw new Error(`Invalid localization filename \`${ file }\``); }
  const source = await readFile(path.join(localizationsDirectory, file), 'utf8');
  catalogs.set(language, flattenLocalization(parse(source), language));
}

const reference = catalogs.get('en');
for ( const [ language, catalog ] of catalogs ) {
  if ( language !== 'en' ) { compareCatalog(reference, catalog, language); }
}

console.log(`Validated ${ catalogs.size } localization catalog(s) and ${ reference.size } key(s).`);

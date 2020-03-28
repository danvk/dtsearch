import fetch from 'node-fetch';
import {sprintf} from 'printj';
import { AlgoliaResponse, Hit } from './response';

const SEARCH_ENDPOINT = 'https://ofcncog2cu-dsn.algolia.net/1/indexes/npm-search'
const PARAMS = {
  hitsPerPage: 20,
  filters: 'types.ts:"definitely-typed" OR types.ts:"included"',
  attributes: 'types,downloadsLast30Days,humanDownloadsLast30Days,popular,keywords,description,modified',
  'x-algolia-agent': 'Algolia for vanilla JavaScript (lite) 3.27.1',
  'x-algolia-application-id': 'OFCNCOG2CU',
  'x-algolia-api-key': 'f54e21fa3a2a0160595bb058179bfb1e',
};

const HEADER = [
  'DLS',
  'POP',
  'NAME',
  'TYPES',
  'DESCRIPTION',
  'DATE',
];

function formatResult(result: Hit) {
  const {types, modified} = result;
  const date = new Date(modified);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  return [
    result.humanDownloadsLast30Days,
    result.popular ? '🔥' : '',
    result.objectID,
    types.ts === 'included' ? 'included' : (types.definitelyTyped || '???'),
    (result.description || '').slice(0, 80),
    sprintf('%04d-%02d-%02d', y, m + 1, d),
  ];
}

function printTable(rows: string[][]) {
  const maxLen = new Array(rows[0].length);
  rows[0].forEach((v, i) => maxLen[i] = v.length);
  for (const row of rows.slice(1)) {
    row.forEach((v, i) => maxLen[i] = Math.max(v.length, maxLen[i]))
  }

  for (const row of rows) {
    const cols = row.map((v, i) => {
      const len = maxLen[i];
      return i === 0 ? v.padStart(len) : v.padEnd(len);
    });
    console.log(cols.join(' '));
  }
}

(async () => {
  const [, , query] = process.argv;

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(PARAMS)) {
    params.set(k, '' + v);
  }
  params.set('query', query);
  const qs = params.toString();

  const response = await fetch(`${SEARCH_ENDPOINT}?${qs}`);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const result: AlgoliaResponse = await response.json();
  const hits = result.hits.filter(hit => !hit.objectID.startsWith('@types/'));

  const table = [HEADER, ...hits.slice(0, 10).map(formatResult)];
  printTable(table);
})().catch(e => {
  console.error(e);
});

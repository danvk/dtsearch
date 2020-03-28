import fetch from 'node-fetch';
import { AlgoliaResponse, Hit } from './response';

const SEARCH_ENDPOINT = 'https://ofcncog2cu-dsn.algolia.net/1/indexes/npm-search'
const PARAMS = {
  hitsPerPage: 20,
  filters: 'types.ts:"definitely-typed" OR types.ts:"included"',
  attributes: 'types,downloadsLast30Days,humanDownloadsLast30Days,popular,keywords,description',
  'x-algolia-agent': 'Algolia for vanilla JavaScript (lite) 3.27.1',
  'x-algolia-application-id': 'OFCNCOG2CU',
  'x-algolia-api-key': 'f54e21fa3a2a0160595bb058179bfb1e',
};

function formatResult(result: Hit) {
  const {types} = result;
  return [
    result.humanDownloadsLast30Days,
    types.ts === 'included' ? 'included' : (types.definitelyTyped || '???'),
    result.objectID,
    result.description,
  ];
}

function printTable(rows: string[][]) {
  const maxLen = new Array(rows[0].length);
  rows[0].forEach((v, i) => maxLen[i] = v.length);
  for (const row of rows.slice(1)) {
    row.forEach((v, i) => maxLen[i] = Math.max(v.length, maxLen[i]))
  }

  for (const row of rows) {
    let s = '';
    row.forEach((v, i) => {
      s += v.padEnd(1 + maxLen[i]);
    });
    console.log(s);
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

  const table = hits.slice(0, 10).map(formatResult);
  printTable(table);
})().catch(e => {
  console.error(e);
});

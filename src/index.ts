import fetch from 'node-fetch';
import { AlgoliaResponse } from './response';

const SEARCH_ENDPOINT = 'https://ofcncog2cu-dsn.algolia.net/1/indexes/npm-search'
const PARAMS = {
  hitsPerPage: 10,
  filters: 'types.ts:"definitely-typed" OR types.ts:"included"',
  attributes: 'types,downloadsLast30Days,humanDownloadsLast30Days,popular,keywords,description',
  'x-algolia-agent': 'Algolia for vanilla JavaScript (lite) 3.27.1',
  'x-algolia-application-id': 'OFCNCOG2CU',
  'x-algolia-api-key': 'f54e21fa3a2a0160595bb058179bfb1e',
};

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

  const results: AlgoliaResponse = await response.json();

  for (const result of results.hits) {
    console.log(result.objectID, result.types, result.humanDownloadsLast30Days, result.description);
  }
})().catch(e => {
  console.error(e);
});

import _ from 'lodash';
import moment from 'moment';
import fetch from 'node-fetch';
import { AlgoliaResponse, Hit } from './response';

const SEARCH_ENDPOINT = 'https://ofcncog2cu-dsn.algolia.net/1/indexes/npm-search'
const ATTRIBUTES = [
  'types',
  'downloadsLast30Days',
  'humanDownloadsLast30Days',
  'popular',
  'keywords',
  'description',
  'modified',
  'homepage',
  'repository',
];
const PARAMS = {
  hitsPerPage: 20,
  filters: 'types.ts:"definitely-typed" OR types.ts:"included"',
  attributes: ATTRIBUTES.join(','),
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
  'UPDATED',
  'HOMEPAGE',
];

interface Column {
  header: string;
  align?: 'left' | 'right';
  maxWidth?: number;
  format: (hit: Hit) => string;
  importance: number;
}

const columns: Column[] = [
  {
    header: 'DLs',
    format: h => h.humanDownloadsLast30Days,
    importance: 1,
    align: 'right',
  },
  {
    header: 'pop',
    format: h => h.popular ? '🔥' : '',
    importance: 1,
  },
  {
    header: 'name',
    format: h => h.objectID,
    importance: 100,
  },
  {
    header: 'types',
    format: ({types}) => types.ts === 'included' ? '<bundled>' : (types.definitelyTyped || '???'),
    importance: 100,
  },
  {
    header: 'description',
    format: h => h.description || '',
    maxWidth: 60,
    importance: 25,
  },
  {
    header: 'updated',
    format: h => moment(h.modified).fromNow(),
    importance: 5,
  },
  {
    header: 'date',
    format: h => moment(h.modified).format('YYYY-MM-DD'),
    importance: 0,
  },
  {
    header: 'homepage',
    format: h => h.homepage || h.repository.url,
    importance: 10,
  },
];

function formatResult(result: Hit) {
  return columns.map(col => col.format(result));
}

function formatColumn(vals: string[], spec: Column) {
  const {maxWidth, align} = spec;
  const maxLen = _.max(vals.map(v => v.length))!;
  const width = Math.min(maxLen, maxWidth || maxLen);

  return vals.map(v => {
    v = v.slice(0, width);
    return align === 'right' ? v.padStart(width) : v.padEnd(width);
  });
}

function isNonNull<T>(x: T | null): x is T {
  return x !== null;
}

function printTable(rows: string[][]) {
  const cols = columns.map((c, j) => (c.importance > 0 ? [
    c.header.toUpperCase(), ...rows.map(r => r[j])
  ] : null)).filter(isNonNull);
  const formattedCols = cols.map((c, j) => formatColumn(c, columns[j]));

  for (let i = 0; i < rows.length; i++) {
    const cols = formattedCols.map(c => c[i]);
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
  const table = hits.slice(0, 10).map(formatResult);
  printTable(table);
})().catch(e => {
  console.error(e);
});

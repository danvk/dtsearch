import {decode} from 'he';
import solver from 'javascript-lp-solver/src/solver';
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

interface Column {
  header: string;
  align?: 'left' | 'right';
  maxWidth?: number;
  format: (hit: Hit) => string;
  importance: number;
  mutexGroup?: string;
}

const columns: Column[] = [
  {
    header: 'DLs',
    format: h => h.humanDownloadsLast30Days,
    importance: 3,
    align: 'right',
  },
  {
    header: 'pop',
    format: h => h.popular ? '🔥' : '',
    importance: 2,
  },
  {
    header: 'name',
    format: h => h.objectID,
    importance: 100,
  },
  {
    header: 'types',
    format: ({types}) => types.ts === 'included' ? '<bundled>' : (types.ts === 'definitely-typed' ? types.definitelyTyped : ''),
    importance: 100,
    mutexGroup: 'types',
  },
  {
    header: 'types',
    format: ({types}) => types.ts === 'included' ? '<inc>' : (types.ts === 'definitely-typed' ? 'dt' : ''),
    importance: 80,
    mutexGroup: 'types',
  },
  {
    header: 'description',
    format: h => decode(h.description || ''),
    maxWidth: 40,
    importance: 25,
    mutexGroup: 'desc',
  },
  {
    header: 'description',
    format: h => decode(h.description || ''),
    maxWidth: 60,
    importance: 30,
    mutexGroup: 'desc',
  },
  {
    header: 'description',
    format: h => decode(h.description || ''),
    importance: 35,
    mutexGroup: 'desc',
  },
  {
    header: 'updated',
    format: h => moment(h.modified).fromNow(),
    importance: 5,
    align: 'right',
  },
  {
    header: 'date',
    format: h => moment(h.modified).format('YYYY-MM-DD'),
    importance: 1,
  },
  {
    header: 'homepage',
    format: h => h.homepage || (h.repository ? h.repository.url : ''),
    importance: 10,
  },
];

function pickColumns(widths: number[]): number[] {
  const mutexGroups = new Set(columns.map(c => c.mutexGroup).filter(isNonNullish));
  const constraints = {width: {max: 1 + (process.stdout.columns || 80)}};
  const mutexes = [...mutexGroups.keys()];
  for (const mutex of mutexes) {
    (constraints as any)[mutex] = {max: 1};
  }
  columns.forEach((c, i) => {
    (constraints as any)[i] = {max: 1};
  });

  const model = {
    opType: 'max',
    optimize: 'importance',
    constraints,
    variables: _.fromPairs(columns.map((c, i) => tuple(
      '' + i,
      {
        importance: c.importance,
        width: 1 + widths[i],
        [i]: 1,
        ..._.fromPairs(mutexes.map(m => tuple(m, c.mutexGroup === m ? 1 : 0))),
      }
    ))),
    ints: columns.map((c, i) => '' + i),
  };

  const result = solver.Solve(model);
  if (result.feasible) {
    return columns.map((c, i) => result[i] ? i : null).filter(isNonNullish);
  }
  return columns.map((c, i) => c.importance >= 25 ? i : null).filter(isNonNullish);
}

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

function isNonNullish<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}

function tuple<T extends any[]>(...t: T): T {
  return t;
}

function printTable(rows: string[][]) {
  const cols = columns.map((c, j) => [
    c.header.toUpperCase(), ...rows.map(r => r[j])
  ]);
  const formattedCols = cols.map((c, j) => formatColumn(c, columns[j]));
  const widths = formattedCols.map(c => c[0].length);
  const colIndices = pickColumns(widths);
  const pickedCols = colIndices.map(i => formattedCols[i]);

  for (let i = 0; i <= rows.length; i++) {
    const cols = pickedCols.map(c => c[i]);
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

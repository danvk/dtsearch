import chalk from 'chalk';
import {program} from 'commander';
import {decode} from 'he';
import solver from 'javascript-lp-solver/src/solver';
import _ from 'lodash';
import moment from 'moment';
import fetch from 'node-fetch';
import { AlgoliaResponse, Hit, Description } from './response';

const version = require('../package.json').version;

program
  .version(version)
  .arguments('<query>')
  .option('--npm', 'Output npm install commands')
  .option('-y, --yarn', 'Output yarn add commands')
  .option('-n, --num <number>', 'Maximum number of results to show', Number, 10)
  .option('--repo', 'Show repo URL, even if package specifies a homepage')
  .option('--debug', 'Enable debug logging')
  .option('--bundled', 'Only show packages with bundled types')
  .option('--dt', 'Only show packages with types on DefinitelyTyped (@types)')
  .option('-u, --untyped', 'Search all packages, even those without type declarations.')
  .parse(process.argv);

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
const filters = {
  default: 'types.ts:"definitely-typed" OR types.ts:"included"',
  dt: 'types.ts:"definitely-typed"',
  bundled: 'types.ts:"included"',
};
const PARAMS = {
  hitsPerPage: 20,
  filters: filters.default,
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
  highlight?: (value: string, hit: Hit) => string;
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
    highlight: (v, h) => highlightValue(v, h._highlightResult.name),
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
    header: 'npm',
    format: h => makeInstallCommand('npm install', h),
    importance: -1,
  },
  {
    header: 'yarn',
    format: h => makeInstallCommand('yarn add', h),
    importance: -1,
  },
  {
    header: 'description',
    format: h => decode(h.description || ''),
    highlight: (v, h) => highlightValue(v, h._highlightResult.description),
    maxWidth: 40,
    importance: 25,
    mutexGroup: 'desc',
  },
  {
    header: 'description',
    format: h => decode(h.description || ''),
    highlight: (v, h) => highlightValue(v, h._highlightResult.description),
    maxWidth: 60,
    importance: 30,
    mutexGroup: 'desc',
  },
  {
    header: 'description',
    format: h => decode(h.description || ''),
    highlight: (v, h) => highlightValue(v, h._highlightResult.description),
    importance: 35,
    mutexGroup: 'desc',
  },
  {
    header: 'date',
    format: h => moment(h.modified).format('YYYY-MM-DD'),
    importance: 1,
  },
  {
    header: 'updated',
    format: h => moment(h.modified).fromNow(),
    importance: 5,
  },
  {
    header: 'homepage',
    format: h => h.homepage || (h.repository ? h.repository.url : ''),
    importance: 10,
  },
  {
    header: 'repo',
    format: h => h.repository ? h.repository.url : '',
    importance: -1,
  }
];

function makeInstallCommand(cmd: string, {types, objectID}: Hit): string {
  const install = `${cmd} ${objectID}`;
  if (types.ts === 'included') {
    return install;
  } else if (types.ts === 'definitely-typed') {
    return `${install} && ${cmd} -D ${types.definitelyTyped}`;
  }
  return '';
}

function pickColumns(widths: number[]): number[] {
  const mutexGroups = new Set(columns.map(c => c.mutexGroup).filter(isNonNullish));
  const constraints: solver.Model['constraints'] = {width: {max: 1 + (process.stdout.columns || 80)}};
  const mutexes = [...mutexGroups.keys()];
  for (const mutex of mutexes) {
    constraints[mutex] = {max: 1};
  }
  columns.forEach((c, i) => {
    // name is included here just for debugging.
    (constraints as any)[i] = {max: 1, name: c.header + (c.maxWidth ? '/' + c.maxWidth : '')};
  });

  const model: solver.Model = {
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

  if (program.debug) {
    console.log('Column LP model:', model);
  }

  const result = solver.Solve(model);
  if (program.debug) {
    console.log('LP result:', result);
  }
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

function highlightValue(val: string, highlightResult: Description | null) {
  if (!highlightResult || highlightResult.matchLevel === 'none') {
    return val;
  } else if (highlightResult.fullyHighlighted) {
    return chalk.bold(val);
  }
  for (const word of highlightResult.matchedWords) {
    val = val.replace(new RegExp(word, 'ig'), chalk.bold(word));
  }
  return val;

  // Alternatively, this could use highlightResult.value.
  // The problem there is that string padding has already happened.
  // 'Foo <em>bar</em> baz <em>quux</em>' -->
  // [ 'Foo ', '<em>bar', ' baz ', '<em>quux', '' ]
  // const parts = highlightResult.value.split(/(<em>.*?)<\/em>/);
  // return parts.map(p => p.startsWith('<em>') ? chalk.bold(p.slice(4)) : p).join('');
}

function isNonNullish<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}

function tuple<T extends any[]>(...t: T): T {
  return t;
}

function printTable(rows: string[][], hits: Hit[]) {
  const cols = columns.map((c, j) => [
    c.header.toUpperCase(), ...rows.map(r => r[j])
  ]);
  const formattedCols = cols.map((c, j) => formatColumn(c, columns[j]));
  const widths = formattedCols.map(c => c[0].length);
  const colIndices = pickColumns(widths);
  const pickedCols = colIndices.map(i => {
    const spec = columns[i];
    const {highlight} = spec;
    if (!highlight) {
      return formattedCols[i];
    } else {
      return formattedCols[i].map((v, j) => j > 0 ? highlight(v, hits[j - 1]) : v)
    }
  });

  for (let i = 0; i <= rows.length; i++) {
    const cols = pickedCols.map(c => c[i]);
    console.log(cols.join(' '));
  }
}

function adjustImportance(header: string, newImportance: number) {
  let adjusted = false;
  for (const col of columns) {
    if (col.header === header) {
      col.importance = newImportance;
      adjusted = true;
    }
  }
  if (!adjusted) {
    throw new Error(`Unable to find column with header ${header}`);
  }
}

function applyFlags() {
  // Add special coluns if the user asks for them.
  if (program.yarn) {
    adjustImportance('yarn', 1000);
  }
  if (program.npm) {
    adjustImportance('npm', 1000);
  }
  if (program.yarn || program.npm) {
    adjustImportance('types', 25);
  }
  if (program.repo) {
    adjustImportance('repo', 1000);
    adjustImportance('homepage', -1);
  }

  const flags = ['untyped', 'dt', 'bundled'];
  if (_.sum(flags.map(flag => program[flag] ? 1 : 0)) > 1) {
    throw new Error(`May only specify one of ${flags}`);
  }

  if (program.untyped) {
    delete PARAMS.filters;
  } else if (program.dt) {
    PARAMS.filters = filters.dt;
  } else if (program.bundled) {
    PARAMS.filters = filters.bundled;
  }
}

(async () => {
  const query = program.args.join(' ');

  applyFlags();

  // Overfetch a bit in case there are @types results.
  const {num} = program;
  PARAMS.hitsPerPage = Math.floor(num * 1.5);

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(PARAMS)) {
    params.set(k, '' + v);
  }
  params.set('query', query);
  const qs = params.toString();
  const url = `${SEARCH_ENDPOINT}?${qs}`;

  if (program.debug) {
    console.log('Algolia query params:', params);
    console.log('Fetching', url);
  }

  const startMs = Date.now();
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const elapsedMs = Date.now() - startMs;
  if (program.debug) {
    console.log('Algolia responded in', elapsedMs, 'ms');
  }

  const result: AlgoliaResponse = await response.json();
  let hits = result.hits.filter(hit => !hit.objectID.startsWith('@types/'));
  if (hits.length === 0) {
    console.log('No results. Try dtsearch -u to include packages without types.');
    return;
  }

  if (program.debug) {
    console.log(`Got ${result.hits.length} results, pared down to ${hits.length}`);
    console.log(result);
  }

  hits = hits.slice(0, num);
  const table = hits.map(formatResult);
  printTable(table, hits);

  if (hits.length < num) {
    console.log(
      `\nOnly ${hits.length} result${hits.length > 1 ? 's' : ''}. ` +
      `Try dtsearch -u to include packages without types.`
    );
  }
})().catch(e => {
  console.error(e);
});

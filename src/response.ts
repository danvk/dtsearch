export interface Hit {
  downloadsLast30Days: number;
  humanDownloadsLast30Days: string;
  popular: boolean;
  modified: number;
  description: string | null;
  keywords: string[];
  types: Types;
  objectID: string;
  homepage: string | null;
  repository: Repository | null;
  stars?: number;
  _highlightResult: HighlightResult;
}

export interface Repository {
  url: string;
  project: string;
  user: string;
  host: string;
  path: string;
  branch: string;
}

export interface HighlightResult {
  name: Description;
  description: Description;
  owner: Owner;
  keywords: Description[];
  owners: Owner[];
  _searchInternal: SearchInternal;
}

export interface SearchInternal {
  alternativeNames: Description[];
}

export interface Description {
  /** Looks like "foo <em>bar</em> baz <em>quux</em>" */
  value: string;
  matchLevel: MatchLevel;
  matchedWords: string[];
  fullyHighlighted?: boolean;
}

export type MatchLevel = "full" | "partial" | "none";

export interface Owner {
  name: Description;
}

export interface TypesIncluded {
  ts: 'included';
}
export interface TypesDT {
  ts: 'definitely-typed',
  definitelyTyped: string;
}
export interface TypesNone {
  ts: false;
}

export type Types = TypesIncluded | TypesDT | TypesNone;

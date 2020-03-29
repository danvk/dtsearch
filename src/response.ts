export interface AlgoliaResponse {
  hits: Hit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  exhaustiveNbHits: boolean;
  query: string;
  params: string;
  processingTimeMS: number;
}

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
  repository: Repository;
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
  value: string;
  matchLevel: MatchLevel;
  matchedWords: string[];
  fullyHighlighted?: boolean;
}

export type MatchLevel = "full" | "none";

export interface Owner {
  name: Description;
}

export interface Types {
  ts: string;
  definitelyTyped?: string;
}

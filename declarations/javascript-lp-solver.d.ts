declare module 'javascript-lp-solver/src/solver' {
  export interface Model {
    opType: 'max';
    optimize: string;
    constraints: Record<string, { max: number }>;
    variables: {[variable: string]: Record<string, number>};
    ints?: string[];
  }

  export interface ResultMeta {
    feasible: boolean;
    result: number;
    bounded: boolean;
    isIntegral: boolean;
  }

  export type Result = ResultMeta & {[variable: string]: number};

  export function Solve(model: Model): Result;
}

// Type declarations for Strudel packages (which don't ship types)

declare module "@strudel/core" {
  export class Pattern {
    constructor(query: (state: any) => any[], steps?: number);
    queryArc(begin: number, end: number): Hap[];
    firstCycle(): Hap[];
    withValue(func: (value: any) => any): Pattern;
    fast(factor: number): Pattern;
    slow(factor: number): Pattern;
    rev(): Pattern;
  }

  export class Hap {
    whole: TimeSpan | null;
    part: TimeSpan;
    value: any;
    context: any;
    hasOnset(): boolean;
    withValue(func: (value: any) => any): Hap;
  }

  export class TimeSpan {
    begin: Fraction;
    end: Fraction;
  }

  export class Fraction {
    valueOf(): number;
    toString(): string;
  }

  export function sequence(...patterns: any[]): Pattern;
  export function stack(...patterns: any[]): Pattern;
  export function cat(...patterns: any[]): Pattern;
}

declare module "@strudel/mini" {
  import { Pattern } from "@strudel/core";

  export function mini(...strings: string[]): Pattern;
  export function mini2ast(code: string, start?: number, userCode?: string): any;
  export function getLeafLocations(code: string): Array<{
    value: string;
    start: number;
    end: number;
  }>;
}

declare module "@strudel/tonal" {
  export function scale(name: string): any;
  export function chord(name: string): any;
  export function voicing(options?: any): any;
}

import { Runner } from '../runner.js';
import type { ISection, IParseResult } from '../types';

export abstract class BaseParser<T> {
  constructor(readonly runner: Runner, readonly options: T) {}

  abstract parse(
    contents: string,
    location: string,
    options?: unknown
  ): Promise<IParseResult>;
}

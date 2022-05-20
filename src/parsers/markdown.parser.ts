import { marked } from 'marked';
import { Runner } from '../runner.js';
import { HTMLParser } from './html.parser.js';
import type {
  IMarkdownParserOptions,
  IHTMLParserParseOptions,
  IParseResult,
} from '../types';

export class MarkdownParser extends HTMLParser {
  constructor(runner: Runner, options: IMarkdownParserOptions = {}) {
    super(runner, options?.html);
  }

  async parse(
    markdown: string,
    location: string,
    options?: IHTMLParserParseOptions
  ): Promise<IParseResult> {
    const html = marked.parse(markdown);
    return super.parse(html, location, options);
  }
}

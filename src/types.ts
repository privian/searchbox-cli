import { CheerioAPI } from 'cheerio';
import type { OptionsOfTextResponseBody } from 'got';

export interface IBinOptions {
  config?: string;
  follow?: boolean;
  manifest: string;
  'max-depth': number;
  'max-pages': number;
  report?: boolean;
}

export interface IFsAdapterOptions {}

export interface IHttpAdapterOptions {
  checkUrl: ((url: string) => string) | null;
  delay: number;
  follow: boolean;
  maxPages: number;
  maxDepth: number;
  request: OptionsOfTextResponseBody;
}

export interface IHTMLParserOptions {
  beforeParse:
    | ((
        $: CheerioAPI,
        html: string,
        location: string,
        options?: IHTMLParserParseOptions
      ) => Promise<boolean>)
    | null;
  headings: string;
  snippet: string;
  snippetPreserve: string;
  snippetMaxElements: number;
  transformFunc: ((section: ISection, location: string) => ISection) | null;
}

export interface IHTMLParserParseOptions {
  origin: string;
}

export interface IMarkdownParserOptions {
  html?: IHTMLParserOptions;
}

export interface IConfig {
  /**
   * Available adapters
   */
  adapter: {
    fs: Partial<IFsAdapterOptions>;
    http: Partial<IHttpAdapterOptions>;
  };
  
  /**
   * Processing concurrency (default: 1)
  */
  concurrency: number;

  /**
   * Path to the manifest file
  */
  manifest: string;

  /**
   * Available parsers
  */
  parser: {
    html: Partial<IHTMLParserOptions>;
    markdown: Partial<IMarkdownParserOptions>;
  };

  /**
   * Whether to produce a `*.report.txt` file
  */
  report: boolean;

  /**
   * URL or a path to crawl
  */
  uri: string;
}

export interface IRunnerOptions extends IConfig {
  config?: string;
}

export interface IItem {
  category?: string;
  link: string;
  snippet?: string;
  title: string;
}

export interface ISection {
  anchor?: string;
  boost?: number;
  category?: string;
  id?: string;
  link?: string;
  snippet?: string;
  title: string;
}

export interface IParseResult {
  links?: string[];
  sections?: ISection[];
}

export interface IManifestField {
  /**
   * Boost score (integer, 0..)
  */
  boost?: number;

  /**
   * Field name
  */
  name: string;

  /**
   * Whether this field is searchable
  */
  search?: boolean;

  /**
   * Whether to use this field for suggestions
   */
  suggestions?: boolean;
}

export interface IManifest {
  /**
   * Website's base URL
   */
  baseUrl?: string;

  /**
   * An array of fields in the index
  */
  fields: IManifestField[];

  /**
   * URL or a relative path to the data file (index)
  */
  data: string;

  /**
   * Manifest version (default: v1)
  */
  version?: string;
}

export interface IReportItem {
  error?: string;
  location: string;
  sections: number;
  time: number;
}

import * as cheerio from 'cheerio';
import sanitizeHTML from 'sanitize-html';
import extend from 'just-extend';
import { URL } from 'url';
import path from 'path';
import { Runner } from '../runner.js';
import { BaseParser } from './base.parser.js';
import type {
  IHTMLParserOptions,
  IParseResult,
  ISection,
  PartialNested,
} from '../types';

export class HTMLParser extends BaseParser<IHTMLParserOptions> {
  static getOptions(
    options: PartialNested<IHTMLParserOptions> = {}
  ): IHTMLParserOptions {
    return extend(
      true,
      {
        beforeParse: null,
        max: {
          sections: -1,
          snippets: -1,
        },
        root: null,
        sanitizer: {
          allowedTags: [
            'br',
            'code',
            'li',
            'ol',
            'p',
            'pre',
            'sub',
            'sup',
            'ul',
          ],
        },
        selectors: {
          headings: 'h1, h2, h3, h4, h5, h6',
          ignore: '',
          snippets: 'code, p, ul, ol',
          stops: '',
        },
        transform: null,
      } as IHTMLParserOptions,
      options
    ) as IHTMLParserOptions;
  }

  constructor(runner: Runner, options: PartialNested<IHTMLParserOptions> = {}) {
    super(runner, HTMLParser.getOptions(options));
  }

  async parse(
    html: string,
    location: string,
    origin: string
  ): Promise<IParseResult> {
    const $ = cheerio.load(html);
    const $root = this.options.root ? this.options.root($) : $.root();
    if (this.options.beforeParse) {
      const result = await this.options.beforeParse($, html, location, origin);
      if (result === false) {
        return {};
      }
    }
    const els = $root
      .find(
        [
          this.options.selectors.headings,
          this.options.selectors.snippets,
          this.options.selectors.stops,
        ]
          .filter((sel) => !!sel)
          .join(', ')
      )
      .toArray();
    let items: Array<ISection & { chunks: string[] }> = [];
    let skip = false;
    for (let el of els) {
      const $el = $(el);
      if (
        this.options.selectors.ignore &&
        $el.closest(this.options.selectors.ignore).length
      ) {
        continue;
      }
      if ($el.is(this.options.selectors.headings)) {
        $el.find('br').replaceWith(' '); // replace hard breaks with spaces
        const title = $el.text().trim();
        if (
          this.options.max.sections > 0 &&
          items.length >= this.options.max.sections
        ) {
          break;
        }
        const headingLevel = Math.min(
          6,
          parseInt(($el as any).tagName?.slice(1) || '0', 10)
        );
        const anchor = $el.attr('id') || $el.find('*[id]').attr('id');
        if (title) {
          skip = false;
          items.push({
            anchor,
            boost: headingLevel > 0 ? 6 - headingLevel : void 0,
            chunks: [],
            title,
          });
        }
      } else if ($el.is(this.options.selectors.stops)) {
        skip = true;
      } else if (
        !skip &&
        (this.options.max.snippets < 0 ||
          items[items.length - 1]?.chunks.length < this.options.max.snippets)
      ) {
        const text = $el.text().trim();
        if (text) {
          items[items.length - 1]?.chunks.push(this.cleanup($, $el, origin));
        }
      }
    }
    let sections: ISection[] = items.map((item) => {
      return {
        title: item.title,
        snippet: item.chunks.join(''),
      };
    });
    if (sections && this.options.transform) {
      sections = sections.map((section) =>
        this.options.transform!(section, location)
      );
    }
    return {
      links: this.getLinks($, origin),
      sections,
    };
  }

  cleanup(
    $: cheerio.CheerioAPI,
    $el: cheerio.Cheerio<cheerio.AnyNode>,
    baseUrl: string
  ): string {
    const parsedUrl = new URL(baseUrl);
    const origin = parsedUrl.origin;
    const baseName = path.basename(baseUrl);
    const basePath = parsedUrl.pathname.slice(
      1,
      parsedUrl.pathname.length - baseName.length - 1
    );
    if ($el.is('h1, h2, h3, h4, h5, h6')) {
      return this.cleanupHeadings($el);
    }
    $el.find('h1, h2, h3, h4, h5, h6').each((_i, el) => {
      $(el).replaceWith(this.cleanupHeadings($(el)));
    });
    return sanitizeHTML($el.toString(), this.options.sanitizer);
  }

  cleanupHeadings($el: cheerio.Cheerio<cheerio.AnyNode>) {
    const $a = $el.find('a');
    return `<div><b>${$a.length ? $a.html() : $el.html()}</b></div>`;
  }

  getLinks($: cheerio.CheerioAPI, origin: string = 'http://localhost') {
    const originUrl = new URL(origin);
    const basePath = path.dirname(originUrl.pathname);
    return $('a[href]')
      .toArray()
      .reduce((acc, a) => {
        const $a = $(a);
        const href = $a.attr('href');
        if (!href || href.startsWith('#') || $a.attr('rel') === 'nofollow') {
          return acc;
        }
        const url = new URL(href, originUrl);
        if (
          (url.origin && url.origin !== originUrl.origin) ||
          !url.pathname.startsWith(basePath)
        ) {
          return acc;
        }
        const ext = path.extname(url.pathname);
        if (ext && ext !== '.html') {
          return acc;
        }
        url.hash = '';
        const link = url.toString();
        if (!acc.includes(link)) {
          acc.push(url.toString());
        }
        return acc;
      }, [] as string[]);
  }
}

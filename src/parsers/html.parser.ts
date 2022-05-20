import * as cheerio from 'cheerio';
import * as entities from 'entities';
import { URL } from 'url';
import path from 'path';
import { Runner } from '../runner.js';
import { BaseParser } from './base.parser.js';
import type {
  IHTMLParserOptions,
  IHTMLParserParseOptions,
  IParseResult,
  ISection,
} from '../types';

export class HTMLParser extends BaseParser<IHTMLParserOptions> {
  static getOptions(
    options: Partial<IHTMLParserOptions> = {}
  ): IHTMLParserOptions {
    return {
      beforeParse: null,
      headings: 'h1, h2, h3, h4, h5, h6',
      snippet: 'p, ul, ol',
      snippetPreserve: 'li',
      snippetMaxElements: -1,
      transformFunc: null,
      ...options,
    };
  }

  constructor(runner: Runner, options: Partial<IHTMLParserOptions> = {}) {
    super(runner, HTMLParser.getOptions(options));
  }

  async parse(
    html: string,
    location: string,
    options?: IHTMLParserParseOptions
  ): Promise<IParseResult> {
    const $ = cheerio.load(html);
    if (this.options.beforeParse) {
      const result = await this.options.beforeParse($, html, location, options);
      if (result === false) {
        return {};
      }
    }
    const headings = $(this.options.headings).toArray();
    const links = this.getLinks($, options?.origin);
    let sections = headings
      .map((heading, i) => {
        const $heading = $(heading);
        const headingLevel = Math.min(
          6,
          parseInt(
            (heading as cheerio.Node & { tagName: string }).tagName?.slice(1) ||
              '0',
            10
          )
        );
        const anchor = $heading.attr('id') || $heading.find('*[id]').attr('id');
        const $next = headings[i + 1]
          ? $heading
              .nextUntil(headings[i + 1] as cheerio.Element)
          : $heading.nextAll();
        const snippets = this.getSnippets($, $next.toArray(), this.options.snippet);
        return {
          anchor,
          boost: headingLevel > 0 ? 6 - headingLevel : null,
          snippet: snippets
            .slice(0, this.options.snippetMaxElements > 0 ? this.options.snippetMaxElements : snippets.length)
            .map((el) => this.sanitize($, $(el)))
            .join(''),
          title: $heading.text().trim(),
        } as ISection;
      })
      .filter((item) => {
        return !!item.title && !!item.snippet;
      });
    if (sections && this.options.transformFunc) {
      sections = sections.map((section) =>
        this.options.transformFunc!(section, location)
      );
    }
    return {
      links,
      sections,
    };
  }

  sanitize(
    $: cheerio.CheerioAPI,
    $el: cheerio.Cheerio<cheerio.Element>
  ): string {
    if (!$el.text().trim()) {
      return '';
    }
    $el.find('*').each((_i, n) => {
      const $n = $(n);
      if (!$n.is(this.options.snippetPreserve)) {
        const text = entities.encodeHTML($n.text());
        if (text) {
          $n.replaceWith(text);
        } else {
          $n.remove();
        }
      } else if (!$n.text().trim()) {
        $n.remove();
      }
    });
    $el.removeAttr(Object.keys($el.attr()).join(' '));
    return $el.toString().trim();
  }

  getSnippets($: cheerio.CheerioAPI, els: cheerio.Element[], selector: string) {
    return els.reduce((acc, el) => {
      const $el = $(el);
      if ($el.is(selector)) {
        acc.push(el);
      } else {
			  acc.push(...$el.find(selector).toArray());
      }
      return acc;
    }, [] as cheerio.Element[]);
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

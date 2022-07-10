import path from 'path';
import got from 'got';
import extend from 'just-extend';
import { BaseAdapter } from './base.adapter.js';
import { Logger } from '../logger.js';
import { Runner } from '../runner.js';
import type { IHttpAdapterOptions } from '../types';

export class HttpAdapter extends BaseAdapter<IHttpAdapterOptions> {
  static getOptions(
    options: Partial<IHttpAdapterOptions> = {}
  ): IHttpAdapterOptions {
    return extend(
      true,
      {
        checkUrl: null,
        delay: 0,
        follow: true,
        maxDepth: 10,
        maxPages: 1000,
        request: {
          method: 'GET',
          timeout: {
            request: 20000,
          },
        },
      },
      options
    ) as IHttpAdapterOptions;
  }

  readonly pages: Set<string> = new Set();

  constructor(runner: Runner, options: Partial<IHttpAdapterOptions> = {}) {
    super(runner, HttpAdapter.getOptions(options));
  }

  async crawl(url: string) {
    this.push(url, url);
    await this.fastq.drained();
    Logger.progress('');
    Logger.log(this.getProgressMessage(''));
    Logger.log('');
    return this.sections;
  }

  async request(url: string) {
    const resp = await got.get(url, {
      throwHttpErrors: false,
      ...this.options.request,
    });
    return {
      body: resp.body,
      headers: resp.headers,
      status: resp.statusCode,
    };
  }

  async worker({
    depth,
    origin,
    url,
  }: {
    depth: number;
    origin: string;
    url: string;
  }) {
    if (this.options.delay) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delay));
    }
    const start = Date.now();
    const { headers, body, status } = await this.request(url);
    if (status !== 200) {
      this.failure(
        url,
        status,
        Date.now() - start,
        `Invalid status code. Received ${status} but expected 200.`
      );
    } else {
      const format = this.getFormat(url, headers['content-type']) || 'html';
      const { links, sections } = await this.runner.parse(
        format,
        body,
        url,
        origin
      );
      this.success(
        sections?.map((section) => {
          return {
            link: section.anchor ? `${url}#${section.anchor}` : url,
            ...section,
          };
        }) || [],
        url,
        Date.now() - start
      );
      if (links?.length && this.options.follow) {
        for (let link of links) {
          this.push(link, origin, depth + 1);
        }
      }
    }
    Logger.progress(this.getProgressMessage(url));
    return true;
  }

  getFormat(url: string, contentType?: string) {
    const format = String(
      contentType?.match(/\w+\/(\w+)/)?.[1] || path.extname(url)?.slice(1)
    ).toLowerCase();
    if (format === 'md') {
      return 'markdown';
    }
    return format;
  }

  push(url: string, origin: string, depth: number = 0) {
    if (this.options.checkUrl) {
      url = this.options.checkUrl(url);
    }
    if (url) {
      if (
        this.pages.has(url) ||
        depth > this.options.maxDepth ||
        this.pages.size >= this.options.maxPages
      ) {
        return false;
      }
      this.pages.add(url);
      return this.fastq.push({
        depth,
        origin,
        url,
      });
    }
    return null;
  }
}

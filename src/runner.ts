import assert from 'assert';
import fsp from 'fs/promises';
import path from 'path';
import extend from 'just-extend';
import { formatBytes } from 'bytes-formatter';
import formatDuration from 'humanize-duration';
import { BaseAdapter } from './adapters/base.adapter.js';
import { FsAdapter } from './adapters/fs.adapter.js';
import { HttpAdapter } from './adapters/http.adapter.js';
import { BaseParser } from './parsers/base.parser.js';
import { HTMLParser } from './parsers/html.parser.js';
import { MarkdownParser } from './parsers/markdown.parser.js';
import { Serializer } from './serializer.js';
import { Logger } from './logger.js';
import type { IManifest, ISection, IRunnerOptions } from './types';

export class Runner {
  static getOptions(options: Partial<IRunnerOptions> = {}): IRunnerOptions {
    return extend(
      true,
      {
        adapter: {
          http: {},
          fs: {},
        },
        concurrency: 1,
        config: null,
        manifest: null,
        parser: {
          html: {},
          markdown: {},
        },
        report: false,
        uri: null,
      },
      options
    ) as IRunnerOptions;
  }

  adapter!: BaseAdapter<unknown>;

  manifest!: IManifest;

  options!: IRunnerOptions;

  parsers: Map<string, BaseParser<unknown>> = new Map();

  constructor(options: Partial<IRunnerOptions> = {}) {
    this.options = Runner.getOptions(options);
    assert(
      typeof this.options.manifest === 'string' && !!this.options.manifest,
      'Runner option `manifest` must be a non-empty string.'
    );
    assert(
      typeof this.options.uri === 'string' && !!this.options.uri,
      'Runner option `uri` must be a non-empty string.'
    );
  }

  async crawl() {
    const start = Date.now();
    await this.loadCustomConfig();
    await this.loadManifest();
    this.createParsers();
    this.createAdapter();
    await this.writeIndex(await this.adapter.crawl(this.options.uri));
    if (this.options.report) {
      await this.writeReport();
    }
    const time = Date.now() - start;
    Logger.log(`Took ${formatDuration(time)}`);
  }

  async loadCustomConfig() {
    if (this.options.config) {
      Logger.log(`Loading config ${this.options.config}`);
      const config = await import(
        path.join(process.cwd(), this.options.config)
      );
      extend(true, this.options, config?.default || config);
    }
  }

  async loadManifest() {
    this.manifest = await this.readManifest(this.options.manifest);
    try {
      await this.validateManifest(this.manifest);
    } catch (err) {
      // @ts-ignore
      throw new Error(`Manifest validation error: ${err?.message}`);
    }
  }

  async parse(
    format: string,
    data: string,
    location: string,
    options?: unknown
  ) {
    const parser = this.parsers.get(format);
    if (!parser) {
      throw new Error(`Unsupported parser format '${format}'.`);
    }
    return this.parsers.get(format)!.parse(data, location, options);
  }

  async readManifest(manifestPath: string): Promise<IManifest> {
    return JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
  }

  async validateManifest(manifest: IManifest) {
    assert(
      typeof manifest.data === 'string' && !!manifest.data,
      'Property `data` must be a non-empty string.'
    );
    assert(
      Array.isArray(manifest.fields) &&
        manifest.fields.every((item) => typeof item === 'object' && !!item),
      'Property `fields` must be an array of objects.'
    );
    manifest.fields.forEach((field, i) => {
      assert(field.name, 'Field `${i}` does not have a name.');
    });
  }

  async writeIndex(sections: Set<ISection>) {
    const size = sections.size;
    let fileName = this.manifest.data;
    if (fileName.match(/^(\/|https?\:\/\/)/)) {
      fileName = this.options.manifest.replace(
        /(\.manifest)?\.json/,
        '.index.json'
      );
    }
    await fsp.writeFile(
      fileName,
      JSON.stringify(Serializer.serialize(sections, this.manifest))
    );
    const stat = await fsp.stat(fileName);
    Logger.log(
      `Index ${fileName} created (${size} entries, ${formatBytes(stat.size)})`
    );
  }

  async writeReport() {
    const fileName = this.options.manifest.replace(
      /(\.manifest)?\.json/,
      '.report.txt'
    );
    await fsp.writeFile(fileName, this.adapter.serializeReport());
  }

  createAdapter() {
    if (this.options.uri.match(/^https?\:\/\//)) {
      Logger.log(`Using HTTP adapter`);
      this.adapter = new HttpAdapter(this, this.options.adapter?.http);
    } else {
      Logger.log(`Using FS adapter`);
      this.adapter = new FsAdapter(this, this.options.adapter?.fs);
    }
  }

  createParsers() {
    if (this.options?.parser?.html) {
      this.parsers.set('html', new HTMLParser(this, this.options.parser?.html));
    }
    if (this.options?.parser?.markdown) {
      this.parsers.set(
        'markdown',
        new MarkdownParser(this, this.options.parser?.markdown)
      );
    }
  }
}

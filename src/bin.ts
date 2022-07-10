#!/usr/bin/env node

import sade from 'sade';
import { Logger } from './logger.js';
import { Runner } from './runner.js';
import type { IBinOptions } from './types';

const cli = sade('searchbox');

cli
  .version(String(process.env.npm_package_version))
  .option('-c, --config', 'Provide path to custom searchbox.config.js')
  .option(
    '-m, --manifest',
    'Provide path to custom manifest',
    'searchbox.manifest.json'
  )
  .option('--max-depth', 'Max. depth of deeplinks to follow', 10)
  .option('--max-pages', 'Max. number of pages to crawl', 1000)
  .option('--no-follow', 'Disable deeplink crawl')
  .option('--report', 'Write report');

cli
  .command('crawl <uri>')
  .describe('Build an index from URI')
  .example('crawl https://example.com/index.html')
  .example('crawl "./build/**/*.html"')
  .action(async (uri, options: IBinOptions) => {
    try {
      const runner = new Runner({
        adapter: {
          http: {
            follow: options.follow !== false,
            maxDepth: options['max-depth'],
            maxPages: options['max-pages'],
          },
          fs: {},
        },
        config: options.config,
        manifest: options.manifest,
        parser: {
          html: {},
          markdown: {},
        },
        report: options.report,
        uri,
      });

      return runner
        .crawl()
        .catch((err) => {
          Logger.log(`Error: ${err.message || err}`);
        })
        .finally(() => {
          process.exit(0);
        });
    } catch (err: any) {
      Logger.log(`Error: ${err.message || err}`);
    }
  });

cli.parse(process.argv);

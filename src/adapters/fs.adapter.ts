import fsp from 'fs/promises';
import path from 'path';
import glob from 'glob';
import { BaseAdapter } from './base.adapter.js';
import { Logger } from '../logger.js';
import { Runner } from '../runner.js';
import type { IFsAdapterOptions } from '../types';

export class FsAdapter extends BaseAdapter<IFsAdapterOptions> {
  protected files: string[] = [];

  constructor(runner: Runner, options: IFsAdapterOptions) {
    super(runner, options);
  }

  async crawl(globPath: string) {
    this.files = this.globDirSync(globPath);
    Logger.log(`Glob ${globPath}`);
    Logger.log(`Found ${this.files.length} files`);
    for (let file of this.files) {
      this.fastq.push({
        file,
        globPath,
      });
    }
    await this.fastq.drained();
    Logger.progress('');
    Logger.log(this.getProgressMessage(''));
    Logger.log('');
    return this.sections;
  }

  async worker({ globPath, file }: { globPath: string; file: string }) {
    const start = Date.now();
    const { sections } = await this.runner.parse(
      'html',
      await this.readFile(file),
      file,
      'http://localhost'
    );
    this.success(sections || [], file, Date.now() - start);
    Logger.progress(this.getProgressMessage(file));
    return true;
  }

  protected globDirSync(dirGlob: string) {
    const cwd = process.cwd();
    return glob.sync(dirGlob).map((file) => {
      return path.resolve(cwd, file);
    });
  }

  protected readFile(file: string) {
    return fsp.readFile(file, 'utf8');
  }
}

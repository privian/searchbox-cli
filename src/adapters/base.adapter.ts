import fastq from 'fastq';
import { Runner } from '../runner.js';
import { Logger } from '../logger.js';
import type { ISection, IReportItem } from '../types';

export abstract class BaseAdapter<T> {
  readonly fastq = fastq.promise(
    this.worker.bind(this),
    this.runner.options.concurrency
  );

  readonly processed: Set<string> = new Set();

  readonly reports: Map<number | string, Set<IReportItem>> = new Map();

  readonly sections: Set<ISection> = new Set();

  failed: number = 0;

  constructor(readonly runner: Runner, readonly options: T) {
    this.fastq.error((err) => {
      if (err) {
        console.log(err)
        Logger.log(`Error: ${err.message || err}`);
      }
    });
  }

  abstract crawl(uri: string): Promise<Set<ISection>>;

  abstract worker(item: unknown): Promise<boolean>;

  getProgressMessage(uri: string) {
    return [
      ``,
      `Processed: ${this.processed.size} pages`,
      `Failed: ${this.failed} pages`,
      `Queued: ${this.fastq.length()} pages`,
      `${uri}`,
    ].join('\n');
  }

  serializeReport() {
    let out = '';
    for (let [status, set] of this.reports) {
      out += `${status === 0 ? 'OK' : status}: ${set.size} pages\n`;
      for (let item of set) {
        out += `  ${item.location} (${item.sections} entries, ${item.time}ms)\n`;
        if (item.error) {
          out += `    ERROR: ${item.error}\n`;
        }
      }
      out += '\n';
    }
    return out;
  }

  failure(
    location: string,
    status: number | string,
    time: number,
    error?: string
  ) {
    this.processed.add(location);
    if (!this.reports.has(status)) {
      this.reports.set(status, new Set());
    }
    this.failed = this.failed + 1;
    this.reports.get(status)!.add({
      error,
      location,
      sections: 0,
      time,
    });
  }

  success(
    sections: ISection[] | ISection,
    location: string | string,
    time: number
  ) {
    const status = 0;
    this.processed.add(location);
    if (!Array.isArray(sections)) {
      sections = [sections];
    }
    for (let section of sections) {
      this.sections.add(section);
    }
    if (!this.reports.has(status)) {
      this.reports.set(status, new Set());
    }
    this.reports.get(status)!.add({
      location,
      sections: sections.length,
      time,
    });
  }
}

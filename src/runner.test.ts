import { Runner } from './runner';

describe('Runner', () => {
  describe('.getOptions()', () => {
    test('should return an object with default options', () => {
      const result = Runner.getOptions();
      expect(result).toEqual({
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
      });
    });

    test('should merge custom options with defaults', () => {
      const result = Runner.getOptions({
        manifest: 'test.manifest.json',
        uri: 'https://example.com',
      });
      expect(result).toEqual({
        adapter: {
          http: {},
          fs: {},
        },
        concurrency: 1,
        config: null,
        manifest: 'test.manifest.json',
        parser: {
          html: {},
          markdown: {},
        },
        report: false,
        uri: 'https://example.com',
      });
    });
  });

  describe('constructor', () => {
    test('should throw error if manifest is null', () => {
      expect(() => {
        new Runner({
          // @ts-ignore
          manifest: null,
          uri: 'https://example.com',
        });
      }).toThrow();
    });

    test('should throw error if manifest is an empty string', () => {
      expect(() => {
        new Runner({
          manifest: '',
          uri: 'https://example.com',
        });
      }).toThrow();
    });

    test('should throw error if manifest is null', () => {
      expect(() => {
        new Runner({
          manifest: 'test.manifest.json',
          // @ts-ignore
          uri: null,
        });
      }).toThrow();
    });

    test('should throw error if manifest is an empty string', () => {
      expect(() => {
        new Runner({
          manifest: 'test.manifest.json',
          uri: '',
        });
      }).toThrow();
    });
  });
});

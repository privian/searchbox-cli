import { HTMLParser } from './html.parser';

describe('HTMLParser', () => {
  describe('.getOptions()', () => {
    test('should return an object with default options', () => {
      const result = HTMLParser.getOptions();
      expect(result).toEqual({
        beforeParse: null,
        headings: 'h1, h2, h3, h4, h5, h6',
        snippet: 'p, ul, ol',
        snippetPreserve: 'li',
        snippetMaxElements: -1,
        transformFunc: null,
      });
    });

    test('should merge custom options with defaults', () => {
      const result = HTMLParser.getOptions({
        headings: 'h1, h2',
        snippetMaxElements: 2,
      });
      expect(result).toEqual({
        beforeParse: null,
        headings: 'h1, h2',
        snippet: 'p, ul, ol',
        snippetPreserve: 'li',
        snippetMaxElements: 2,
        transformFunc: null,
      });
    });
  });
});

import { Runner } from '../runner';
import { HTMLParser } from './html.parser';
import type { IHTMLParserOptions } from '../types';

describe('HTMLParser', () => {
  describe('.getOptions()', () => {
    test('should return an object with default options', () => {
      const result = HTMLParser.getOptions();
      expect(result).toEqual({
        beforeParse: null,
        max: {
          sections: -1,
          snippets: -1,
        },
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
        root: null,
        transform: null,
      } as IHTMLParserOptions);
    });

    test('should merge custom options with defaults', () => {
      const result = HTMLParser.getOptions({
        selectors: {
          headings: 'h1, h2',
        },
        max: {
          snippets: 2,
        },
      });
      expect(result).toEqual({
        beforeParse: null,
        max: {
          sections: -1,
          snippets: 2,
        },
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
          headings: 'h1, h2',
          ignore: '',
          snippets: 'code, p, ul, ol',
          stops: '',
        },
        root: null,
        transform: null,
      } as IHTMLParserOptions);
    });
  });

  describe('instance', () => {
    let parser: HTMLParser;

    beforeEach(() => {
      parser = new HTMLParser(
        new Runner({
          manifest: 'test.manifest.json',
          uri: '/',
        }),
        {
          max: {
            sections: 10,
          },
        }
      );
    });

    describe('.parse()', () => {
      test('should return an array of sections', async () => {
        const result = await parser.parse(
          `
        <html>
          <body>
            <div>
              <h1>Main<br>title</h1>
            </div>

            <div>
              <p>Section <em>text</em> 1</p>
              <p>Section <span>text 2</span></p>
            </div>

            <hr>

            <div>
              <p>Section text 3</p>

              <h2>Subtitle</h2>
            </div>

            <div>
              <div>
                <p>Subsection item 1</p>
              </div>
            </div>
          </body>
        </html>
        `,
          '/',
          'https://localhost'
        );
        expect(result).toEqual({
          links: [],
          sections: [
            {
              title: 'Main title',
              snippet: `<p>Section text 1</p><p>Section text 2</p><p>Section text 3</p>`,
            },
            {
              title: 'Subtitle',
              snippet: `<p>Subsection item 1</p>`,
            },
          ],
        });
      });
    });
  });
});

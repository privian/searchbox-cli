import { Serializer } from './serializer';
import type { IManifest, ISection } from './types';

describe('Serializer', () => {
  const sections: Set<ISection> = new Set([
    {
      link: 'https://example.com/test1',
      title: 'Test 1',
    },
    {
      title: 'Test 2',
      link: 'https://example.com/test2',
    },
  ]);

  const manifest: IManifest = {
    baseUrl: 'https://example.com/',
    data: '',
    fields: [
      {
        name: 'id',
      },
      {
        name: 'title',
      },
      {
        name: 'other',
      },
      {
        name: 'link',
        search: false,
      },
    ],
  };

  describe('.serialize()', () => {
    test('should serialize data', () => {
      const result = Serializer.serialize(sections, manifest);
      expect(result).toEqual(
        [...sections.values()].map((section, i) => {
          return [
            i + 1,
            section.title,
            null,
            section.link?.replace(manifest.baseUrl!, ''),
          ];
        })
      );
    });
  });
});

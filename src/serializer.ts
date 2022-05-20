import { IManifest, ISection } from './types.js';

export class Serializer {
  static serialize(sections: Set<ISection>, manifest: IManifest) {
    const baseUrl = manifest.baseUrl;
    const fields = manifest!.fields.map(({ name }) => name);
    let counter = 0;
    return [...sections.values()].map((section) => {
      return fields.map((field) => {
        // @ts-ignore
        const value = section[field] || null;
        switch (field) {
          case 'id':
            if (!value && field === 'id') {
              counter = counter + 1;
              return counter;
            }
          case 'link':
            if (value && baseUrl) {
              return value.replace(baseUrl, '');
            }
          default:
            return value;
        }
      });
    });
  }
}

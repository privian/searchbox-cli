<h1 align="center">
  <br>
  <img src="https://raw.githubusercontent.com/privian/searchbox/master/public/searchbox.svg" alt="Searchbox" width="200">
  <br>
  Searchbox CLI
  <br>
</h1>

<h4 align="center">A CLI utility to crawl and index websites for <a href="https://github.com/privian/searchbox">Searchbox</a>.</h4>

<p align="center">
  <a href="https://badge.fury.io/js/searchbox-cli">
    <img src="https://badge.fury.io/js/searchbox-cli.svg"
         alt="npm.js">
  </a>
</p>

<p align="center">
  <a href="#what">What</a> •
  <a href="#features">Features</a> •
  <a href="#install">Install</a> •
  <a href="#usage">Usage</a> •
  <a href="#manifest">Manifest</a> •
  <a href="#related">Related</a> •
  <a href="#license">License</a>
</p>

## Status

Searchbox is currently in Beta.

Your help and contributions are very much appreciated.

## What

This a repo for a CLI utility that helps you build a [Searchbox](https://github.com/privian/searchbox) index from a live website or build files.

## Features

- Filesystem and HTTP support
- HTML and Markdown parsing
- Automatically follows links

## Install

```shell
npm install searchbox-cli
```

## Usage

1. Create a new file `searchbox.manifest.json` (see specification below)
2. Execute `searchbox`:

```shell
searchbox crawl https://example.com
```

Or run `searchbox --help` for options.

## Manifest

Basic manifest example (`searchbox.manifest.json`):

```json
{
  "baseUrl": "https://example.com/",
  "data": "searchbox.index.json",
  "fields": [
    {
      "name": "id",
      "search": false
    },
    {
      "name": "title",
      "suggestions": true
    },
    {
      "name": "snippet"
    },
    {
      "name": "link",
      "search": false
    }
  ]
}
```

### Manifest specification

```ts
export interface IManifestField {
  /**
   * Boost score (integer, 0..)
   */
  boost?: number;

  /**
   * Field name, see "Supported fields"
   */
  name: string;

  /**
   * Whether this field is searchable
   */
  search?: boolean;

  /**
   * Whether to use this field for suggestions
   */
  suggestions?: boolean;
}

export interface IManifest {
  /**
   * Website's base URL
   */
  baseUrl?: string;

  /**
   * An array of fields in the index
   */
  fields: IManifestField[];

  /**
   * URL or a relative path to the data file (index)
   */
  data: string;

  /**
   * Manifest version (default: v1)
   */
  version?: string;
}
```

### Supported fields

- `id`: unique ID of the item
- `title`: the title
- `snippet`: (optional) the description or a snippet of the item
- `category`: (optional) the category for the item
- `link`: target URL of the item

## Config file

To apply more advanced configuration options, use a custom `searchbox.config.js` file that exports your configuration options:

For example config files, see [examples](/blob/master/examples).

```js
export default {
  manifest: 'searchbox.manifest.json',
  adapter: {
    http: {
      // skip `/legal/**` pages
      checkUrl: (url) => {
        if (url.includes('/legal/')) {
          return null;
        }
        return url;
      },
    },
  },
  parser: {
    html: {
      selectors: {
        // parse only H1-H3 as items
        headings: 'h1, h2, h3',
      },
    },
  },
};
```

### Config specification

See [src/types.ts](/blob/maste/src/types.ts) for more details.

## Related

- [Searchbox](https://github.com/privian/searchbox) - UI component for website search

## License

MIT
